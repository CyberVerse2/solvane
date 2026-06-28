#![no_std]
//! Smart wallet for AI agents on Stellar (Soroban custom account).
//!
//! Each agent gets one instance of this contract. It is a *custom account*:
//! transactions are authorized by verifying an ed25519 signature from a
//! registered signer in `__check_auth`, and — critically — spending policy is
//! enforced there too. Because the checks live on-chain in the authorization
//! path, a leaked session key still cannot move funds past the configured
//! limits or to non-allowlisted recipients.
//!
//! Auth model
//! - `Admin` signers: full control (manage signers, set policy, arbitrary calls).
//! - `Spender` signers: may only move funds, and only within policy.
//!
//! Standard smart-wallet flow (no wrapper entrypoint needed): a relayer submits
//! a top-level `token.transfer(from = <this wallet>, to, amount)`. The token
//! calls `from.require_auth()`, the host invokes `__check_auth` here, we verify
//! the signature and enforce policy on the auth contexts. The relayer's account
//! pays the fee, so the agent wallet needs no XLM.

use soroban_sdk::{
    auth::{Context, CustomAccountInterface},
    contract, contracterror, contractimpl, contracttype, crypto::Hash, symbol_short, Address,
    Bytes, BytesN, Env, TryIntoVal, Vec,
};

#[contract]
pub struct SmartWallet;

#[contracttype]
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Role {
    Spender = 0,
    Admin = 1,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// ed25519 public key -> Role
    Signer(BytesN<32>),
    /// token contract -> max amount allowed per transfer (deny if unset)
    Limit(Address),
    /// when true, recipients must be present in the allowlist
    EnforceAllowlist,
    /// recipient address -> allowed
    Recipient(Address),
}

#[contracttype]
#[derive(Clone)]
pub struct SignerSig {
    // Field names match the signature ScVal produced by the Stellar SDK's
    // `authorizeEntry` helper ({ public_key, signature }), so standard tooling
    // can sign for this wallet with no custom encoding.
    pub public_key: BytesN<32>,
    pub signature: BytesN<64>,
}

#[contracterror]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[repr(u32)]
pub enum Error {
    NotAuthorized = 1,
    UnknownSigner = 2,
    InvalidArgs = 3,
    InvalidAmount = 4,
    LimitExceeded = 5,
    RecipientNotAllowed = 6,
    AdminRequired = 7,
}

#[contractimpl]
impl SmartWallet {
    /// Deploy-time constructor: registers the first owner as an Admin signer.
    pub fn __constructor(env: Env, owner: BytesN<32>) {
        env.storage()
            .persistent()
            .set(&DataKey::Signer(owner), &Role::Admin);
    }

    // ---- Admin operations (each requires this wallet's own auth -> __check_auth) ----

    /// Add or update a signer with the given role.
    pub fn add_signer(env: Env, signer: BytesN<32>, role: Role) {
        env.current_contract_address().require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Signer(signer), &role);
    }

    /// Remove a signer.
    pub fn remove_signer(env: Env, signer: BytesN<32>) {
        env.current_contract_address().require_auth();
        env.storage().persistent().remove(&DataKey::Signer(signer));
    }

    /// Set the per-transfer spend cap for a token (0 disables the token).
    pub fn set_limit(env: Env, token: Address, max_per_transfer: i128) {
        env.current_contract_address().require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Limit(token), &max_per_transfer);
    }

    /// Toggle recipient allowlist enforcement.
    pub fn set_allowlist_enforced(env: Env, enforced: bool) {
        env.current_contract_address().require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::EnforceAllowlist, &enforced);
    }

    /// Add or remove a recipient from the allowlist.
    pub fn set_recipient(env: Env, recipient: Address, allowed: bool) {
        env.current_contract_address().require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Recipient(recipient), &allowed);
    }

    // ---- Views (read-only, no auth) ----

    pub fn signer_role(env: Env, signer: BytesN<32>) -> Option<Role> {
        env.storage().persistent().get(&DataKey::Signer(signer))
    }

    pub fn limit(env: Env, token: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Limit(token))
            .unwrap_or(0)
    }

    pub fn allowlist_enforced(env: Env) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::EnforceAllowlist)
            .unwrap_or(false)
    }
}

#[contractimpl]
impl CustomAccountInterface for SmartWallet {
    type Signature = Vec<SignerSig>;
    type Error = Error;

    fn __check_auth(
        env: Env,
        signature_payload: Hash<32>,
        signatures: Vec<SignerSig>,
        auth_contexts: Vec<Context>,
    ) -> Result<(), Error> {
        // 1) Verify every provided signature comes from a registered signer over
        //    the payload, and track the highest role we have a valid signature for.
        let msg = Bytes::from_array(&env, &signature_payload.to_array());
        let mut is_admin = false;
        let mut any_valid = false;

        for sig in signatures.iter() {
            let role: Role = env
                .storage()
                .persistent()
                .get(&DataKey::Signer(sig.public_key.clone()))
                .ok_or(Error::UnknownSigner)?;
            // ed25519_verify panics if the signature is invalid.
            env.crypto()
                .ed25519_verify(&sig.public_key, &msg, &sig.signature);
            any_valid = true;
            if role == Role::Admin {
                is_admin = true;
            }
        }
        if !any_valid {
            return Err(Error::NotAuthorized);
        }

        // 2) Enforce policy on each authorized context.
        let me = env.current_contract_address();
        let transfer_fn = symbol_short!("transfer");

        for ctx in auth_contexts.iter() {
            match ctx {
                Context::Contract(c) => {
                    if c.contract == me {
                        // An admin operation on this wallet itself.
                        if !is_admin {
                            return Err(Error::AdminRequired);
                        }
                    } else if c.fn_name == transfer_fn {
                        // token.transfer(from, to, amount)
                        let from: Address = c
                            .args
                            .get(0)
                            .ok_or(Error::InvalidArgs)?
                            .try_into_val(&env)
                            .map_err(|_| Error::InvalidArgs)?;
                        if from == me {
                            let to: Address = c
                                .args
                                .get(1)
                                .ok_or(Error::InvalidArgs)?
                                .try_into_val(&env)
                                .map_err(|_| Error::InvalidArgs)?;
                            let amount: i128 = c
                                .args
                                .get(2)
                                .ok_or(Error::InvalidArgs)?
                                .try_into_val(&env)
                                .map_err(|_| Error::InvalidArgs)?;
                            enforce_spend(&env, &c.contract, &to, amount)?;
                        } else if !is_admin {
                            // Moving funds we don't own as `from` — admin only.
                            return Err(Error::AdminRequired);
                        }
                    } else if !is_admin {
                        // Any other external call requires admin.
                        return Err(Error::AdminRequired);
                    }
                }
                // Contract creation from this account requires admin.
                _ => {
                    if !is_admin {
                        return Err(Error::AdminRequired);
                    }
                }
            }
        }

        Ok(())
    }
}

/// Per-transfer policy: positive amount, within the token's cap, and (if
/// enforced) to an allowlisted recipient.
fn enforce_spend(env: &Env, token: &Address, to: &Address, amount: i128) -> Result<(), Error> {
    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }
    let limit: i128 = env
        .storage()
        .persistent()
        .get(&DataKey::Limit(token.clone()))
        .unwrap_or(0);
    if amount > limit {
        return Err(Error::LimitExceeded);
    }
    let enforced: bool = env
        .storage()
        .persistent()
        .get(&DataKey::EnforceAllowlist)
        .unwrap_or(false);
    if enforced {
        let allowed: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Recipient(to.clone()))
            .unwrap_or(false);
        if !allowed {
            return Err(Error::RecipientNotAllowed);
        }
    }
    Ok(())
}

mod test;

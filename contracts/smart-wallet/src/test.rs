#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

fn owner_key(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[7u8; 32])
}

#[test]
fn constructor_registers_owner_as_admin() {
    let env = Env::default();
    let owner = owner_key(&env);
    let id = env.register(SmartWallet, (owner.clone(),));
    let client = SmartWalletClient::new(&env, &id);

    assert_eq!(client.signer_role(&owner), Some(Role::Admin));
}

#[test]
fn admin_can_set_policy() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = owner_key(&env);
    let id = env.register(SmartWallet, (owner.clone(),));
    let client = SmartWalletClient::new(&env, &id);

    let token = Address::generate(&env);
    client.set_limit(&token, &1_000i128);
    assert_eq!(client.limit(&token), 1_000i128);

    let spender = BytesN::from_array(&env, &[9u8; 32]);
    client.add_signer(&spender, &Role::Spender);
    assert_eq!(client.signer_role(&spender), Some(Role::Spender));

    client.set_allowlist_enforced(&true);
    assert!(client.allowlist_enforced());

    client.remove_signer(&spender);
    assert_eq!(client.signer_role(&spender), None);
}

"use client";

/**
 * Client-side Horizon (testnet) helpers for the operator's classic account:
 * read XLM balance and submit a Freighter-signed XLM payment.
 */
import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  Networks,
  StrKey,
} from "@stellar/stellar-sdk";
import { sign, WalletError } from "./freighter";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

/** Returns the native XLM balance, or null if the account isn't funded yet. */
export async function getXlmBalance(address: string): Promise<number | null> {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native ? Number(native.balance) : 0;
  } catch (e) {
    // 404 → account not created/funded on testnet
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw e;
  }
}

export interface SendResult {
  hash: string;
}

/** Build a payment, sign with Freighter, submit. Throws typed WalletError. */
export async function sendXlm(opts: {
  from: string;
  to: string;
  amount: string;
}): Promise<SendResult> {
  const { from, to, amount } = opts;

  if (!StrKey.isValidEd25519PublicKey(to)) {
    throw new WalletError("no-account", "Recipient is not a valid Stellar address.");
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    throw new WalletError("no-account", "Enter an amount greater than zero.");
  }

  let account;
  try {
    account = await server.loadAccount(from);
  } catch {
    throw new WalletError("no-account", "Your account isn't funded on testnet yet.");
  }

  const balance = account.balances.find((b) => b.asset_type === "native");
  if (balance && Number(balance.balance) < amt + 0.5) {
    throw new WalletError(
      "no-account",
      `Insufficient balance — you have ${Number(balance.balance).toFixed(2)} XLM.`,
    );
  }

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({ destination: to, asset: Asset.native(), amount: amt.toFixed(7) }),
    )
    .setTimeout(120)
    .build();

  const signedXdr = await sign(tx.toXDR(), from);
  const signed = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

  try {
    const res = await server.submitTransaction(signed);
    return { hash: res.hash };
  } catch (e: unknown) {
    const codes = (e as { response?: { data?: { extras?: { result_codes?: unknown } } } })
      ?.response?.data?.extras?.result_codes;
    throw new WalletError(
      "rejected",
      `Network rejected the transaction${codes ? `: ${JSON.stringify(codes)}` : "."}`,
    );
  }
}

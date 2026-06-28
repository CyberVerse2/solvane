/**
 * Server-only: deploy a fresh smart-wallet instance to testnet.
 * Mirrors service/src/scripts/deploy.ts — upload wasm (cached by hash on-chain),
 * then instantiate with __constructor(owner). The relayer pays all fees.
 */
import "server-only";
import {
  rpc,
  TransactionBuilder,
  Operation,
  Keypair,
  Address,
  xdr,
  BASE_FEE,
  Networks,
} from "@stellar/stellar-sdk";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK = Networks.TESTNET;
const server = new rpc.Server(RPC_URL);

// In Docker the compiled wasm is copied to a fixed path (SMART_WALLET_WASM);
// locally it sits in the cargo target dir relative to the web app.
const WASM_PATH =
  process.env.SMART_WALLET_WASM ??
  join(process.cwd(), "..", "target", "wasm32v1-none", "release", "smart_wallet.wasm");

async function submit(source: Keypair, op: xdr.Operation) {
  const account = await server.getAccount(source.publicKey());
  let tx = new TransactionBuilder(account, {
    fee: (Number(BASE_FEE) * 100).toString(),
    networkPassphrase: NETWORK,
  })
    .addOperation(op)
    .setTimeout(60)
    .build();
  tx = await server.prepareTransaction(tx);
  tx.sign(source);
  const sent = await server.sendTransaction(tx);
  if (sent.status === "ERROR") {
    throw new Error(`submit failed: ${JSON.stringify(sent.errorResult)}`);
  }
  let got = await server.getTransaction(sent.hash);
  while (got.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1000));
    got = await server.getTransaction(sent.hash);
  }
  if (got.status !== "SUCCESS") throw new Error(`tx failed: ${got.status}`);
  return got;
}

// A freshly uploaded wasm can take a few ledgers to become visible to the RPC's
// simulation state ("Wasm does not exist"); retry with backoff to ride it out.
async function submitWithRetry(
  source: Keypair,
  op: xdr.Operation,
  attempts = 8,
  delayMs = 2500,
) {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await submit(source, op);
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("submit failed after retries");
}

export interface DeployResult {
  address: string;
  ownerPubkeyHex: string;
  ownerSecret: string;
  txHash: string;
}

export async function deploySmartWallet(): Promise<DeployResult> {
  if (!process.env.RELAYER_SECRET) {
    throw new Error(
      "RELAYER_SECRET is not configured on the server, so deployment fees can't be paid. Set RELAYER_SECRET (a funded testnet S… key) in the environment and redeploy.",
    );
  }
  const relayer = Keypair.fromSecret(process.env.RELAYER_SECRET);
  const owner = Keypair.random();
  const ownerPubkeyHex = Buffer.from(owner.rawPublicKey()).toString("hex");
  const wasm = readFileSync(WASM_PATH);

  const uploaded = await submitWithRetry(
    relayer,
    Operation.uploadContractWasm({ wasm }),
  );
  const wasmHash = uploaded.returnValue!.bytes();

  // Fixed salt so retries target the same contract address.
  const deployed = await submitWithRetry(
    relayer,
    Operation.createCustomContract({
      address: Address.fromString(relayer.publicKey()),
      wasmHash,
      salt: randomBytes(32),
      constructorArgs: [xdr.ScVal.scvBytes(Buffer.from(ownerPubkeyHex, "hex"))],
    }),
  );

  return {
    address: Address.fromScVal(deployed.returnValue!).toString(),
    ownerPubkeyHex,
    ownerSecret: owner.secret(),
    txHash: deployed.txHash,
  };
}

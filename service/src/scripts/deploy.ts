/**
 * Deploy one smart-wallet instance to testnet for the agent.
 *
 * Two on-chain steps, both submitted and paid for by the relayer:
 *   1. upload the wasm (once per code version)
 *   2. instantiate it with __constructor(owner = agent raw pubkey)
 *
 * The resulting contract address IS the agent's wallet address.
 */
import "dotenv/config";
import {
  rpc,
  TransactionBuilder,
  Operation,
  Keypair,
  Address,
  xdr,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { readFileSync, appendFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { NETWORK_PASSPHRASE, RPC_URL, WASM_PATH } from "../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const server = new rpc.Server(RPC_URL);

async function submit(
  source: Keypair,
  buildOp: () => xdr.Operation,
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  const account = await server.getAccount(source.publicKey());
  let tx = new TransactionBuilder(account, {
    fee: (Number(BASE_FEE) * 100).toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(buildOp())
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
  if (got.status !== "SUCCESS") {
    throw new Error(`tx ${sent.hash} failed: ${got.status}`);
  }
  return got;
}

async function main() {
  const relayer = Keypair.fromSecret(process.env.RELAYER_SECRET!);
  const agentPubHex = process.env.AGENT_PUBKEY_HEX!;
  const wasm = readFileSync(join(__dirname, "..", "..", WASM_PATH));

  console.log("1/2 uploading wasm…");
  const uploaded = await submit(relayer, () =>
    Operation.uploadContractWasm({ wasm }),
  );
  const wasmHash = uploaded.returnValue!.bytes();
  console.log("    wasm hash:", wasmHash.toString("hex"));

  console.log("2/2 deploying instance with constructor(owner)…");
  const deployed = await submit(relayer, () =>
    Operation.createCustomContract({
      address: Address.fromString(relayer.publicKey()),
      wasmHash,
      salt: randomBytes(32),
      constructorArgs: [xdr.ScVal.scvBytes(Buffer.from(agentPubHex, "hex"))],
    }),
  );
  const walletAddress = Address.fromScVal(deployed.returnValue!).toString();

  console.log("\n✅ Smart wallet deployed:", walletAddress);
  appendFileSync(join(__dirname, "../../.env"), `WALLET_ADDRESS=${walletAddress}\n`);
  console.log("   (appended WALLET_ADDRESS to service/.env)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

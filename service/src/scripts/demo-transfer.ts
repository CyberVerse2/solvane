/**
 * Full policy demo on testnet (native XLM via its Stellar Asset Contract):
 *   1. fund the smart wallet with 500 XLM
 *   2. per-transfer limit is 250 XLM (set by set-limit.ts)
 *   3. transfer 100 XLM  → APPROVED  (within limit)
 *   4. transfer 400 XLM  → BLOCKED   (LimitExceeded, rejected in __check_auth)
 *
 * The deny is enforced on-chain in the authorization path — not by this client.
 */
import "dotenv/config";
import {
  Keypair,
  Asset,
  Address,
  Contract,
  TransactionBuilder,
  rpc,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE, RPC_URL } from "../config.js";
import { transfer } from "../wallet.js";

const DP = 10_000_000n;
const server = new rpc.Server(RPC_URL);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function balance(token: string, who: string): Promise<bigint> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const src = await server.getAccount(
      Keypair.fromSecret(process.env.RELAYER_SECRET!).publicKey(),
    );
    const tx = new TransactionBuilder(src, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(new Contract(token).call("balance", Address.fromString(who).toScVal()))
      .setTimeout(30)
      .build();
    const sim = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationError(sim) && sim.result) {
      return BigInt(scValToNative(sim.result.retval) ?? 0);
    }
    await sleep(800);
  }
  return 0n;
}

/** Plain SAC transfer authorized by the relayer (classic source-account auth). */
async function fund(token: string, relayer: Keypair, to: string, amount: bigint) {
  const src = await server.getAccount(relayer.publicKey());
  const tx = new TransactionBuilder(src, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      new Contract(token).call(
        "transfer",
        Address.fromString(relayer.publicKey()).toScVal(),
        Address.fromString(to).toScVal(),
        nativeToScVal(amount, { type: "i128" }),
      ),
    )
    .setTimeout(60)
    .build();
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(relayer);
  const sent = await server.sendTransaction(prepared);
  let got = await server.getTransaction(sent.hash);
  while (got.status === "NOT_FOUND") {
    await sleep(1000);
    got = await server.getTransaction(sent.hash);
  }
  if (got.status !== "SUCCESS") throw new Error(`fund failed: ${got.status}`);
}

async function main() {
  const relayer = Keypair.fromSecret(process.env.RELAYER_SECRET!);
  const agent = Keypair.fromSecret(process.env.AGENT_SECRET!);
  const wallet = process.env.WALLET_ADDRESS!;
  const token = Asset.native().contractId(NETWORK_PASSPHRASE);
  const recipient = relayer.publicKey(); // a funded account that can receive XLM

  console.log("wallet :", wallet);

  if ((await balance(token, wallet)) < 100n * DP) {
    console.log("funding wallet with 500 XLM…");
    await fund(token, relayer, wallet, 500n * DP);
  }
  console.log("wallet balance:", Number(await balance(token, wallet)) / 1e7, "XLM");

  // APPROVED — within the 250 XLM cap
  console.log("\n→ transfer 100 XLM (within limit)…");
  const okHash = await transfer({ relayer, agent, wallet, token, to: recipient, amount: 100n * DP });
  console.log("  ✅ APPROVED:", okHash);

  // BLOCKED — exceeds the 250 XLM cap, rejected inside __check_auth
  console.log("\n→ transfer 400 XLM (over limit)…");
  try {
    const bad = await transfer({ relayer, agent, wallet, token, to: recipient, amount: 400n * DP });
    console.log("  ⚠️ unexpectedly APPROVED:", bad);
    process.exit(1);
  } catch {
    console.log("  ⛔ BLOCKED on-chain by policy (LimitExceeded) — as expected");
  }

  console.log("\nwallet balance:", Number(await balance(token, wallet)) / 1e7, "XLM");
  console.log("\n🎉 Policy-enforced transfers verified end-to-end.");
}

main().catch((e) => {
  console.error("\n❌", e.message ?? e);
  process.exit(1);
});

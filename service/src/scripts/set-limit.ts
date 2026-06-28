/**
 * Validate the write path end-to-end on testnet:
 *   1. read the current per-transfer limit (should be 0 / unset)
 *   2. set_limit(token, 250.0) — signed by the agent key via __check_auth
 *   3. read it back to confirm the on-chain state changed
 */
import "dotenv/config";
import { Keypair, Asset, Address, nativeToScVal } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "../config.js";
import { setLimit, readView } from "../wallet.js";

const SEVEN_DP = 10_000_000n;

async function readLimit(wallet: string, token: string): Promise<bigint> {
  const v = (await readView(wallet, "limit", [
    Address.fromString(token).toScVal(),
  ])) as bigint;
  return BigInt(v);
}

async function main() {
  const relayer = Keypair.fromSecret(process.env.RELAYER_SECRET!);
  const agent = Keypair.fromSecret(process.env.AGENT_SECRET!);
  const wallet = process.env.WALLET_ADDRESS!;
  const token = Asset.native().contractId(NETWORK_PASSPHRASE); // native XLM SAC

  console.log("wallet :", wallet);
  console.log("token  :", token);

  const before = await readLimit(wallet, token);
  console.log("\nlimit before:", before.toString());

  console.log("signing set_limit(250.0) with agent key…");
  const hash = await setLimit({
    relayer,
    agent,
    wallet,
    token,
    maxPerTransfer: 250n * SEVEN_DP,
  });
  console.log("  ✅ tx:", hash);

  const after = await readLimit(wallet, token);
  console.log("\nlimit after :", after.toString(), `(${Number(after) / 1e7} XLM)`);

  if (after === 250n * SEVEN_DP) {
    console.log("\n🎉 Write path verified — agent signature passed __check_auth.");
  } else {
    console.log("\n⚠️  Unexpected limit value.");
    process.exit(1);
  }
  void nativeToScVal;
}

main().catch((e) => {
  console.error("\n❌", e.message ?? e);
  process.exit(1);
});

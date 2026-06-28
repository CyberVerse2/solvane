/**
 * Generate the two keypairs the PoC needs and fund the relayer on testnet.
 *
 *  - relayer: a normal Stellar account that submits transactions and PAYS FEES.
 *             Agents' smart wallets hold no XLM; the relayer covers gas. This is
 *             how we get Crossmint-style "gasless" UX on Stellar.
 *  - agent:   the ed25519 keypair that controls the smart wallet (the owner/Admin
 *             signer). Its RAW 32-byte public key is the contract constructor arg.
 *
 * Writes everything to service/.env (gitignored).
 */
import { Keypair } from "@stellar/stellar-sdk";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { FRIENDBOT_URL } from "../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, "../../.env");

async function fund(pubkey: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_URL}/?addr=${encodeURIComponent(pubkey)}`);
  if (!res.ok && res.status !== 400) {
    throw new Error(`friendbot failed for ${pubkey}: ${res.status}`);
  }
}

async function main() {
  const relayer = Keypair.random();
  const agent = Keypair.random();

  console.log("Funding relayer via friendbot…");
  await fund(relayer.publicKey());

  const agentPubHex = Buffer.from(agent.rawPublicKey()).toString("hex");

  const env = [
    `RELAYER_PUBLIC=${relayer.publicKey()}`,
    `RELAYER_SECRET=${relayer.secret()}`,
    `AGENT_PUBLIC=${agent.publicKey()}`,
    `AGENT_SECRET=${agent.secret()}`,
    `AGENT_PUBKEY_HEX=${agentPubHex}`,
    "",
  ].join("\n");
  writeFileSync(ENV_PATH, env);

  console.log("\nWrote service/.env");
  console.log("  relayer :", relayer.publicKey(), "(funded)");
  console.log("  agent   :", agent.publicKey());
  console.log("  agent raw pubkey (constructor arg):", agentPubHex);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

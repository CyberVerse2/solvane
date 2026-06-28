import { Networks } from "@stellar/stellar-sdk";

/** Testnet configuration for the agent wallet PoC. */
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

/** Path to the compiled smart-wallet WASM (relative to repo root). */
export const WASM_PATH =
  "../target/wasm32v1-none/release/smart_wallet.wasm";

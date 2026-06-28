/**
 * Server-only: stream a wallet's on-chain token movements in real time using
 * Soroban RPC `getEvents`. We filter the native asset contract's `transfer`
 * events down to those where our wallet is the sender or recipient, so the
 * console reflects actual ledger activity (not a mock feed).
 */
import "server-only";
import { rpc, Asset, Address, xdr, scValToNative, Networks } from "@stellar/stellar-sdk";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK = Networks.TESTNET;
const server = new rpc.Server(RPC_URL);

export interface WalletEvent {
  id: string;
  ledger: number;
  direction: "in" | "out";
  counterparty: string;
  amount: number;
  txHash: string;
}

export async function getWalletEvents(wallet: string): Promise<WalletEvent[]> {
  try {
    const sac = Asset.native().contractId(NETWORK);
    const latest = (await server.getLatestLedger()).sequence;
    const startLedger = Math.max(1, latest - 9000); // within RPC retention

    const transferSym = xdr.ScVal.scvSymbol("transfer").toXDR("base64");
    const walletScv = Address.fromString(wallet).toScVal().toXDR("base64");

    // The native SAC transfer event is [transfer, from, to] or [transfer, from,
    // to, asset] depending on protocol — cover both lengths (filters are OR'd).
    const { events } = await server.getEvents({
      startLedger,
      filters: [
        { type: "contract", contractIds: [sac], topics: [[transferSym, walletScv, "*"]] },
        { type: "contract", contractIds: [sac], topics: [[transferSym, "*", walletScv]] },
        { type: "contract", contractIds: [sac], topics: [[transferSym, walletScv, "*", "*"]] },
        { type: "contract", contractIds: [sac], topics: [[transferSym, "*", walletScv, "*"]] },
      ],
      limit: 50,
    });

    const out: WalletEvent[] = [];
    for (const ev of events) {
      const topics = ev.topic.map((t) => scValToNative(t));
      const from = String(topics[1] ?? "");
      const to = String(topics[2] ?? "");
      const amount = Number(scValToNative(ev.value) ?? 0) / 1e7;
      const isOut = from === wallet;
      out.push({
        id: ev.id,
        ledger: ev.ledger,
        direction: isOut ? "out" : "in",
        counterparty: isOut ? to : from,
        amount,
        txHash: ev.txHash,
      });
    }
    return out.reverse(); // newest first
  } catch {
    return [];
  }
}

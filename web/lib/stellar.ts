/**
 * Server-only Soroban reads for the Solvane console.
 *
 * View calls are run through `simulateTransaction` (no fee, no signature) using
 * the relayer's PUBLIC key as the simulation source — so reading on-chain state
 * never touches a secret. Only `lib/deploy.ts` (create wallet) needs the secret.
 */
import "server-only";
import {
  rpc,
  Contract,
  Address,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Asset,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK = Networks.TESTNET;
const SIM_SOURCE =
  process.env.SIM_SOURCE ?? "GAHZHQ2PSDTSJI7MRAWNBDVGUJ5L25OCXIXRXZTOEJB72UDERE2NHORJ";

export const server = new rpc.Server(RPC_URL);

export interface RpcHealth {
  ok: boolean;
  ms: number;
  ledger: number;
}

export async function pingRpc(): Promise<RpcHealth> {
  const t = Date.now();
  try {
    const l = await server.getLatestLedger();
    return { ok: true, ms: Date.now() - t, ledger: l.sequence };
  } catch {
    return { ok: false, ms: Date.now() - t, ledger: 0 };
  }
}

async function callView(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
): Promise<unknown> {
  const source = await server.getAccount(SIM_SOURCE);
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim) || !sim.result) {
    throw new Error(`view ${method} failed`);
  }
  return scValToNative(sim.result.retval);
}

export interface OnchainState {
  ownerRole: "admin" | "spender" | null;
  allowlistEnforced: boolean;
  nativeBalance: number;
  nativeLimit: number;
  ledger: number;
}

/** Read the live contract state for a deployed smart wallet. */
export async function readWalletState(
  address: string,
  ownerPubkeyHex: string,
): Promise<OnchainState | null> {
  try {
    const [roleRaw, enforced] = await Promise.all([
      callView(address, "signer_role", [
        xdr.ScVal.scvBytes(Buffer.from(ownerPubkeyHex, "hex")),
      ]),
      callView(address, "allowlist_enforced"),
    ]);

    const sac = Asset.native().contractId(NETWORK);

    let nativeBalance = 0;
    try {
      const bal = (await callView(sac, "balance", [
        Address.fromString(address).toScVal(),
      ])) as bigint;
      nativeBalance = Number(bal) / 1e7;
    } catch {
      /* wallet holds no native SAC balance yet */
    }

    let nativeLimit = 0;
    try {
      const lim = (await callView(address, "limit", [
        Address.fromString(sac).toScVal(),
      ])) as bigint;
      nativeLimit = Number(lim) / 1e7;
    } catch {
      /* no limit set for native token */
    }

    const latest = await server.getLatestLedger();
    const role = roleRaw === 1 ? "admin" : roleRaw === 0 ? "spender" : null;
    return {
      ownerRole: role,
      allowlistEnforced: Boolean(enforced),
      nativeBalance,
      nativeLimit,
      ledger: latest.sequence,
    };
  } catch {
    return null;
  }
}

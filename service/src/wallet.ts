/**
 * Agent wallet operations via the custom-account signing flow.
 *
 * Because the contract's `Vec<SignerSig>` uses the field names { public_key,
 * signature }, the SDK's built-in `authorizeEntry` produces exactly the
 * signature ScVal our `__check_auth` expects — no hand-rolled XDR.
 *
 * Flow for any wallet-authorized call:
 *   1. simulate the invocation (relayer as source) to discover auth entries
 *   2. sign each address-credential entry with the agent key (authorizeEntry)
 *   3. rebuild the op carrying the signed auth, assemble with the simulation's
 *      resource fees, relayer signs the envelope and pays — then submit.
 */
import {
  rpc,
  TransactionBuilder,
  Operation,
  Keypair,
  Address,
  Contract,
  xdr,
  authorizeEntry,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE, RPC_URL } from "./config.js";

const server = new rpc.Server(RPC_URL);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Invoke `method` on a smart wallet, authorized by `signer`, paid by `relayer`. */
export async function signedInvoke(opts: {
  relayer: Keypair;
  signer: Keypair;
  contractId: string;
  method: string;
  args?: xdr.ScVal[];
}): Promise<string> {
  const { relayer, signer, contractId, method, args = [] } = opts;

  const contract = new Contract(contractId);
  const hostOp = contract.call(method, ...args);
  const hostFn = hostOp.body().invokeHostFunctionOp().hostFunction();

  // 1) first simulation (no auth) just to discover the required auth entries
  const simSource = await server.getAccount(relayer.publicKey());
  const simTx = new TransactionBuilder(simSource, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(hostOp)
    .setTimeout(60)
    .build();

  const sim1 = await server.simulateTransaction(simTx);
  if (rpc.Api.isSimulationError(sim1)) {
    throw new Error(`simulation failed: ${sim1.error}`);
  }

  // 2) sign each wallet-address auth entry with the agent key
  const validUntil = (await server.getLatestLedger()).sequence + 60;
  const signedAuth: xdr.SorobanAuthorizationEntry[] = [];
  for (const entry of sim1.result?.auth ?? []) {
    const isAddr =
      entry.credentials().switch().value ===
      xdr.SorobanCredentialsType.sorobanCredentialsAddress().value;
    signedAuth.push(
      isAddr ? await authorizeEntry(entry, signer, validUntil, NETWORK_PASSPHRASE) : entry,
    );
  }

  // 3) re-simulate WITH the signed auth so __check_auth actually runs and its
  //    storage reads land in the footprint (the first pass skips __check_auth
  //    because the entry isn't signed yet — its reads would be missing).
  const source = await server.getAccount(relayer.publicKey());
  const raw = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.invokeHostFunction({ func: hostFn, auth: signedAuth }))
    .setTimeout(60)
    .build();

  const sim2 = await server.simulateTransaction(raw);
  if (rpc.Api.isSimulationError(sim2)) {
    throw new Error(`auth simulation failed: ${sim2.error}`);
  }

  // 4) assemble (op already carries our signed auth → kept), relayer signs + pays
  const prepared = rpc.assembleTransaction(raw, sim2).build();
  prepared.sign(relayer);

  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") {
    throw new Error(`send failed: ${JSON.stringify(sent.errorResult)}`);
  }
  let got = await server.getTransaction(sent.hash);
  while (got.status === "NOT_FOUND") {
    await sleep(1000);
    got = await server.getTransaction(sent.hash);
  }
  if (got.status !== "SUCCESS") {
    throw new Error(`tx ${sent.hash} failed: ${got.status}`);
  }
  return sent.hash;
}

/** Admin: set the per-transfer cap for a token. */
export function setLimit(opts: {
  relayer: Keypair;
  agent: Keypair;
  wallet: string;
  token: string;
  maxPerTransfer: bigint;
}) {
  return signedInvoke({
    relayer: opts.relayer,
    signer: opts.agent,
    contractId: opts.wallet,
    method: "set_limit",
    args: [
      Address.fromString(opts.token).toScVal(),
      nativeToScVal(opts.maxPerTransfer, { type: "i128" }),
    ],
  });
}

/** Admin: toggle recipient allowlist enforcement. */
export function setAllowlistEnforced(opts: {
  relayer: Keypair;
  agent: Keypair;
  wallet: string;
  enforced: boolean;
}) {
  return signedInvoke({
    relayer: opts.relayer,
    signer: opts.agent,
    contractId: opts.wallet,
    method: "set_allowlist_enforced",
    args: [nativeToScVal(opts.enforced, { type: "bool" })],
  });
}

/** Move a Soroban token out of the wallet — succeeds only if policy permits. */
export function transfer(opts: {
  relayer: Keypair;
  agent: Keypair;
  wallet: string;
  token: string;
  to: string;
  amount: bigint;
}) {
  const tokenContract = new Contract(opts.token);
  // token.transfer(from = wallet, to, amount); the token calls from.require_auth()
  // → our wallet's __check_auth verifies the signature AND enforces policy.
  return signedInvoke({
    relayer: opts.relayer,
    signer: opts.agent,
    contractId: opts.token,
    method: "transfer",
    args: [
      Address.fromString(opts.wallet).toScVal(),
      Address.fromString(opts.to).toScVal(),
      nativeToScVal(opts.amount, { type: "i128" }),
    ],
  }).then((hash) => {
    void tokenContract;
    return hash;
  });
}

/** Read a view function's decoded return value (no signature, no fee). */
export async function readView(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
): Promise<unknown> {
  const source = await server.getAccount(
    Keypair.fromSecret(process.env.RELAYER_SECRET!).publicKey(),
  );
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim) || !sim.result) {
    throw new Error(`view ${method} failed`);
  }
  return scValToNative(sim.result.retval);
}

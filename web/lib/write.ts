/**
 * Server-only writes to a smart wallet via the custom-account signing flow
 * (validated against testnet in service/src/wallet.ts).
 *
 * Two-pass simulation: simulate to find auth entries → sign with the agent key
 * (authorizeEntry produces the { public_key, signature } ScVal our __check_auth
 * expects) → re-simulate WITH the signed auth so __check_auth's storage reads
 * land in the footprint → assemble, relayer signs + pays, submit.
 */
import "server-only";
import {
  rpc,
  TransactionBuilder,
  Operation,
  Keypair,
  Address,
  Contract,
  Asset,
  xdr,
  authorizeEntry,
  nativeToScVal,
  Networks,
  BASE_FEE,
} from "@stellar/stellar-sdk";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK = Networks.TESTNET;
const server = new rpc.Server(RPC_URL);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function nativeTokenId() {
  return Asset.native().contractId(NETWORK);
}

/** Can the server sign for this wallet (i.e. do we hold its owner key)? */
export function canSignFor(ownerPubkeyHex?: string) {
  return Boolean(ownerPubkeyHex) && ownerPubkeyHex === process.env.AGENT_PUBKEY_HEX;
}

async function signedInvoke(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
): Promise<string> {
  if (!process.env.RELAYER_SECRET || !process.env.AGENT_SECRET) {
    throw new Error(
      "RELAYER_SECRET and AGENT_SECRET must be set on the server to sign policy writes. Add them to the environment and redeploy.",
    );
  }
  const relayer = Keypair.fromSecret(process.env.RELAYER_SECRET);
  const agent = Keypair.fromSecret(process.env.AGENT_SECRET);

  const hostOp = new Contract(contractId).call(method, ...args);
  const hostFn = hostOp.body().invokeHostFunctionOp().hostFunction();

  const simSource = await server.getAccount(relayer.publicKey());
  const simTx = new TransactionBuilder(simSource, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(hostOp)
    .setTimeout(60)
    .build();

  const sim1 = await server.simulateTransaction(simTx);
  if (rpc.Api.isSimulationError(sim1)) throw new Error(sim1.error);

  const validUntil = (await server.getLatestLedger()).sequence + 60;
  const signedAuth: xdr.SorobanAuthorizationEntry[] = [];
  for (const entry of sim1.result?.auth ?? []) {
    const isAddr =
      entry.credentials().switch().value ===
      xdr.SorobanCredentialsType.sorobanCredentialsAddress().value;
    signedAuth.push(
      isAddr ? await authorizeEntry(entry, agent, validUntil, NETWORK) : entry,
    );
  }

  const source = await server.getAccount(relayer.publicKey());
  const raw = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(Operation.invokeHostFunction({ func: hostFn, auth: signedAuth }))
    .setTimeout(60)
    .build();

  const sim2 = await server.simulateTransaction(raw);
  if (rpc.Api.isSimulationError(sim2)) throw new Error(sim2.error);

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
  if (got.status !== "SUCCESS") throw new Error(`tx failed: ${got.status}`);
  return sent.hash;
}

/** Set the native-token per-transfer cap (XLM), signed by the agent owner. */
export function setNativeLimit(wallet: string, xlm: number): Promise<string> {
  const stroops = BigInt(Math.round(xlm * 1e7));
  return signedInvoke(wallet, "set_limit", [
    Address.fromString(nativeTokenId()).toScVal(),
    nativeToScVal(stroops, { type: "i128" }),
  ]);
}

"use client";

/**
 * Thin typed wrapper around the Freighter browser extension.
 *
 * In Solvane, Freighter is the *human operator's* wallet — used to sign in and
 * fund the platform. It does NOT replace the agents' smart wallets; it's the
 * identity of the person who provisions and funds them.
 */
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";

export const TESTNET = "TESTNET";

/** Distinct, typed failure modes so the UI can render specific error states. */
export type WalletErrorKind =
  | "not-installed"
  | "rejected"
  | "wrong-network"
  | "no-account";

export class WalletError extends Error {
  constructor(
    public kind: WalletErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "WalletError";
  }
}

export async function freighterInstalled(): Promise<boolean> {
  try {
    const res = await isConnected();
    return Boolean(res?.isConnected);
  } catch {
    return false;
  }
}

/** Prompt the user to connect; returns their public key. */
export async function connect(): Promise<{ address: string; network: string }> {
  if (!(await freighterInstalled())) {
    throw new WalletError(
      "not-installed",
      "Freighter isn't installed. Add it from freighter.app, then reload.",
    );
  }

  const access = await requestAccess();
  if (access.error || !access.address) {
    throw new WalletError("rejected", "Connection request was declined.");
  }

  const net = await getNetwork();
  if (net.error) {
    throw new WalletError("rejected", "Could not read the wallet network.");
  }
  if (net.network !== TESTNET) {
    throw new WalletError(
      "wrong-network",
      `Switch Freighter to Testnet (currently ${net.network ?? "unknown"}).`,
    );
  }

  return { address: access.address, network: net.network };
}

/** Restore an existing session without prompting (for page reloads). */
export async function restore(): Promise<string | null> {
  try {
    if (!(await freighterInstalled())) return null;
    if (!(await isAllowed()).isAllowed) return null;
    const res = await getAddress();
    return res.address || null;
  } catch {
    return null;
  }
}

/** Ask Freighter to sign an XDR on testnet; returns the signed XDR. */
export async function sign(xdr: string, address: string): Promise<string> {
  const res = await signTransaction(xdr, {
    networkPassphrase: "Test SDF Network ; September 2015",
    address,
  });
  if (res.error || !res.signedTxXdr) {
    throw new WalletError("rejected", "You declined to sign the transaction.");
  }
  return res.signedTxXdr;
}

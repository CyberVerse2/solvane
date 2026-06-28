"use client";

/**
 * Multi-wallet connection via Stellar Wallets Kit.
 *
 * Freighter is one of several supported operator wallets — the kit's auth modal
 * lets the human pick Freighter / xBull / Albedo / Rabet / Hana / Lobstr. This
 * is the operator's identity wallet; it never signs agent transactions.
 *
 * The kit is dynamically imported so its browser-only internals never evaluate
 * during SSR.
 */

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

const TESTNET = "Test SDF Network ; September 2015";

const WALLET_NAMES: Record<string, string> = {
  freighter: "Freighter",
  xbull: "xBull",
  albedo: "Albedo",
  rabet: "Rabet",
  hana: "Hana",
  lobstr: "LOBSTR",
};

export function walletName(id: string | null): string {
  return (id && WALLET_NAMES[id]) || "Wallet";
}

type Kit = typeof import("@creit.tech/stellar-wallets-kit");
let kitMod: Kit | null = null;
let inited = false;
let selectedId: string | null = null;

async function load(): Promise<Kit> {
  if (!kitMod) kitMod = await import("@creit.tech/stellar-wallets-kit");
  if (!inited) {
    // Module classes are per-wallet subpath exports.
    const [freighter, xbull, albedo, rabet, hana, lobstr] = await Promise.all([
      import("@creit.tech/stellar-wallets-kit/modules/freighter"),
      import("@creit.tech/stellar-wallets-kit/modules/xbull"),
      import("@creit.tech/stellar-wallets-kit/modules/albedo"),
      import("@creit.tech/stellar-wallets-kit/modules/rabet"),
      import("@creit.tech/stellar-wallets-kit/modules/hana"),
      import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
    ]);
    const { StellarWalletsKit, Networks, KitEventType } = kitMod;
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: [
        new freighter.FreighterModule(),
        new xbull.xBullModule(),
        new albedo.AlbedoModule(),
        new rabet.RabetModule(),
        new hana.HanaModule(),
        new lobstr.LobstrModule(),
      ],
    });
    StellarWalletsKit.on(KitEventType.WALLET_SELECTED, (e) => {
      selectedId = (e.payload as { id?: string })?.id ?? null;
    });
    inited = true;
  }
  return kitMod;
}

export interface Connected {
  address: string;
  walletId: string | null;
}

/** Open the multi-wallet picker; resolves once a wallet is connected. */
export async function openWalletModal(): Promise<Connected> {
  const { StellarWalletsKit } = await load();
  try {
    const { address } = await StellarWalletsKit.authModal();
    return { address, walletId: selectedId };
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "Connection cancelled.";
    throw new WalletError("rejected", msg);
  }
}

/** Restore a prior session: re-select the module so signing works again. */
export async function restoreWallet(walletId: string, address: string): Promise<string> {
  const { StellarWalletsKit } = await load();
  try {
    StellarWalletsKit.setWallet(walletId);
    selectedId = walletId;
  } catch {
    /* module no longer available — keep address for display only */
  }
  return address;
}

/** Sign an XDR with the connected wallet on testnet. */
export async function signXdr(xdr: string, address: string): Promise<string> {
  const { StellarWalletsKit } = await load();
  try {
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: TESTNET,
      address,
    });
    return signedTxXdr;
  } catch (e) {
    throw new WalletError("rejected", (e as { message?: string })?.message ?? "Signing was declined.");
  }
}

export async function disconnectWallet(): Promise<void> {
  if (!kitMod) return;
  try {
    await kitMod.StellarWalletsKit.disconnect();
  } catch {
    /* ignore */
  }
  selectedId = null;
}

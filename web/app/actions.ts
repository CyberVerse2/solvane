"use server";

import { revalidatePath } from "next/cache";
import { deploySmartWallet } from "@/lib/deploy";
import { addCreatedAgent } from "@/lib/agents-store";
import { setNativeLimit } from "@/lib/write";

export interface WriteResult {
  ok: boolean;
  txHash?: string;
  error?: string;
}

/** Set the native-token per-transfer cap on-chain, signed by the agent owner. */
export async function setLimitAction(
  wallet: string,
  xlm: number,
): Promise<WriteResult> {
  try {
    const txHash = await setNativeLimit(wallet, xlm);
    revalidatePath("/agents", "layout");
    return { ok: true, txHash };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "write failed" };
  }
}

export interface CreateWalletInput {
  name: string;
  model: string;
  maxPerTransfer: number;
  allowlistEnforced: boolean;
}

export interface CreateWalletResult {
  ok: boolean;
  address?: string;
  txHash?: string;
  ownerSecret?: string;
  error?: string;
}

export async function createWalletAction(
  input: CreateWalletInput,
): Promise<CreateWalletResult> {
  try {
    const res = await deploySmartWallet();
    const slug =
      input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
      `agent-${res.address.slice(2, 7).toLowerCase()}`;

    addCreatedAgent({
      id: slug,
      name: input.name.trim() || "Unnamed agent",
      model: input.model,
      address: res.address,
      ownerPubkeyHex: res.ownerPubkeyHex,
      maxPerTransfer: input.maxPerTransfer,
      allowlistEnforced: input.allowlistEnforced,
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/agents");
    revalidatePath("/");

    return {
      ok: true,
      address: res.address,
      txHash: res.txHash,
      ownerSecret: res.ownerSecret,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "deploy failed" };
  }
}

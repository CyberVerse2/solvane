"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, TriangleAlert, X } from "lucide-react";
import { setLimitAction } from "@/app/actions";
import { cn } from "@/lib/utils";

/**
 * Inline editor that writes the native-token per-transfer cap on-chain via the
 * validated signing flow. Only rendered for wallets the server can sign for.
 */
export function LimitEditor({
  wallet,
  current,
}: {
  wallet: string;
  current: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(current || 250));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okHash, setOkHash] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await setLimitAction(wallet, Number(value) || 0);
    setBusy(false);
    if (res.ok) {
      setOkHash(res.txHash ?? null);
      setEditing(false);
      router.refresh();
      setTimeout(() => setOkHash(null), 4000);
    } else {
      setError(res.error ?? "failed");
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:border-signal/40 hover:text-signal"
        title="Set per-transfer limit on-chain"
      >
        {okHash ? (
          <>
            <Check className="h-3 w-3 text-signal" /> saved
          </>
        ) : (
          <>
            <Pencil className="h-3 w-3" /> set limit
          </>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            disabled={busy}
            className="w-24 rounded-md border border-line bg-bg/60 py-1 pl-2 pr-9 font-mono text-[12px] text-ink outline-none focus:border-signal/40"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-faint">
            XLM
          </span>
        </div>
        <button
          onClick={save}
          disabled={busy}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border border-signal/40 bg-signal-soft text-signal",
            busy && "opacity-60",
          )}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          disabled={busy}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-muted hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {busy && (
        <span className="font-mono text-[10.5px] text-faint">
          signing · submitting to testnet…
        </span>
      )}
      {error && (
        <span className="flex items-center gap-1 font-mono text-[10.5px] text-danger">
          <TriangleAlert className="h-3 w-3" /> {error.slice(0, 48)}
        </span>
      )}
    </div>
  );
}

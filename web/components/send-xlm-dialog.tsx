"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, TriangleAlert, ExternalLink, Send } from "lucide-react";
import { Button, Copyable } from "@/components/ui";
import { useWallet } from "@/components/wallet-provider";
import { sendXlm } from "@/lib/horizon";
import { WalletError } from "@/lib/freighter";
import { shortAddr } from "@/lib/utils";

/** The Solvane fee relayer — a meaningful default recipient (top it up). */
const RELAYER = "GAHZHQ2PSDTSJI7MRAWNBDVGUJ5L25OCXIXRXZTOEJB72UDERE2NHORJ";

export function SendXlmDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { address, balance, refreshBalance } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [to, setTo] = useState(RELAYER);
  const [amount, setAmount] = useState("10");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  async function submit() {
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      const res = await sendXlm({ from: address, to, amount });
      setHash(res.hash);
      await refreshBalance();
    } catch (e) {
      setError(e instanceof WalletError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    onClose();
    setTimeout(() => {
      setHash(null);
      setError(null);
      setBusy(false);
    }, 200);
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="reveal relative w-full max-w-[420px] rounded-xl border border-line-strong bg-panel p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              Freighter
            </span>
            <h2 className="mt-1.5 text-[22px] text-ink">
              {hash ? "Payment sent" : "Send XLM"}
            </h2>
          </div>
          <button
            onClick={close}
            className="rounded-lg border border-line p-1.5 text-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {hash ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2.5 rounded-lg border border-positive/25 bg-positive/10 px-3.5 py-3">
              <Check className="h-4 w-4 text-positive" />
              <span className="text-[13px] text-ink">Confirmed on testnet</span>
            </div>
            <div className="rounded-lg border border-line bg-bg/40 px-3.5 py-3">
              <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
                Transaction hash
              </p>
              <Copyable value={hash} display={shortAddr(hash, 10, 10)} />
            </div>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-[13px] text-muted transition-colors hover:text-ink"
            >
              View on Stellar Expert <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Button variant="primary" className="w-full" onClick={close}>
              Done
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-[12.5px] text-muted">
              Signed by your Freighter wallet on Stellar testnet. Default recipient is
              the Solvane fee relayer that funds your agents&apos; transactions.
            </p>

            <label className="block space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                Recipient
              </span>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg/60 px-3 py-2.5 font-mono text-[12.5px] text-ink outline-none focus:border-signal/40"
              />
            </label>

            <label className="block space-y-2">
              <span className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                <span>Amount · XLM</span>
                {balance !== null && <span>balance {balance.toFixed(2)}</span>}
              </span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-lg border border-line bg-bg/60 px-3 py-2.5 font-mono text-[14px] text-ink outline-none focus:border-signal/40"
              />
            </label>

            {error && (
              <p className="flex items-start gap-1.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2.5 text-[12.5px] text-danger">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}

            <Button variant="primary" className="w-full" onClick={submit} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Confirm in Freighter…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

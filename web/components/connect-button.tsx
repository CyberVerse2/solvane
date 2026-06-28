"use client";

import { useEffect, useRef, useState } from "react";
import { Wallet, ChevronDown, Send, LogOut, Copy, Check, Loader2, TriangleAlert } from "lucide-react";
import { useWallet } from "@/components/wallet-provider";
import { SendXlmDialog } from "@/components/send-xlm-dialog";
import { shortAddr } from "@/lib/utils";

export function ConnectButton() {
  const { address, balance, walletLabel, connecting, error, connect, disconnect } =
    useWallet();
  const [menu, setMenu] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!address) {
    return (
      <div className="flex flex-col items-end">
        <button
          onClick={connect}
          disabled={connecting}
          className="flex items-center gap-2 rounded-lg border border-signal/30 bg-signal-soft px-3 py-1.5 text-[13px] font-medium text-signal transition-colors hover:bg-signal/15 disabled:opacity-60"
        >
          {connecting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wallet className="h-3.5 w-3.5" />
          )}
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
        {error && (
          <span className="mt-1 hidden max-w-[220px] items-start gap-1 text-right font-mono text-[10.5px] text-danger sm:flex">
            <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setMenu((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 transition-colors hover:border-line-strong"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-signal/40 to-info/30">
          <Wallet className="h-3 w-3 text-bg" />
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block font-mono text-[12px] text-ink">
            {shortAddr(address, 4, 4)}
          </span>
          <span className="block font-mono text-[10px] text-faint">
            {balance === null ? "unfunded" : `${balance.toFixed(2)} XLM`}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-faint" />
      </button>

      {menu && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-60 overflow-hidden rounded-xl border border-line-strong bg-panel shadow-2xl">
          <div className="border-b border-line px-3.5 py-3">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
              Operator · {walletLabel}
            </p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(address);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="mt-1 flex items-center gap-1.5 font-mono text-[12px] text-ink"
            >
              {shortAddr(address, 6, 6)}
              {copied ? (
                <Check className="h-3 w-3 text-signal" />
              ) : (
                <Copy className="h-3 w-3 text-faint" />
              )}
            </button>
            <p className="mt-1.5 font-mono text-[13px] text-signal">
              {balance === null ? "account unfunded" : `${balance.toFixed(4)} XLM`}
            </p>
          </div>
          <button
            onClick={() => {
              setMenu(false);
              setSendOpen(true);
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-ink transition-colors hover:bg-white/[0.04]"
          >
            <Send className="h-4 w-4 text-muted" /> Send XLM
          </button>
          <button
            onClick={() => {
              setMenu(false);
              disconnect();
            }}
            className="flex w-full items-center gap-2.5 border-t border-line px-3.5 py-2.5 text-[13px] text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" /> Disconnect
          </button>
        </div>
      )}

      <SendXlmDialog open={sendOpen} onClose={() => setSendOpen(false)} />
    </div>
  );
}

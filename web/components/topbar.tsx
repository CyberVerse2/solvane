"use client";

import { useEffect, useState } from "react";
import { Search, Command } from "lucide-react";
import { ConnectButton } from "@/components/connect-button";
import { MobileNav } from "@/components/mobile-nav";
import { cn } from "@/lib/utils";

interface Health {
  ok: boolean;
  ms: number;
  ledger: number;
}

export function Topbar() {
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        const h = (await r.json()) as Health;
        if (alive) setHealth(h);
      } catch {
        if (alive) setHealth({ ok: false, ms: 0, ledger: 0 });
      }
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-bg/70 px-4 backdrop-blur-xl lg:gap-4 lg:px-7">
      <MobileNav />

      {/* Command search */}
      <button className="group flex h-9 flex-1 items-center gap-2.5 rounded-lg border border-line bg-white/[0.02] px-3 text-left transition-colors hover:border-line-strong sm:max-w-xs">
        <Search className="h-4 w-4 text-faint" />
        <span className="flex-1 text-[13px] text-faint">Search agents, txns…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint sm:flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <div className="flex items-center gap-2.5">
        {/* Live RPC status — pings Soroban testnet every 10s */}
        <div
          className="hidden items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 md:flex"
          title={health ? `Ledger ${health.ledger.toLocaleString()}` : "Connecting…"}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              !health ? "bg-faint" : health.ok ? "pulse-dot bg-positive" : "bg-danger",
            )}
          />
          <span className="font-mono text-[11px] text-muted">
            {!health ? "RPC …" : health.ok ? `RPC ${health.ms}ms` : "RPC down"}
          </span>
        </div>

        {/* Network switch */}
        <div className="flex items-center rounded-lg border border-line p-0.5">
          {(["testnet", "mainnet"] as const).map((n) => (
            <button
              key={n}
              onClick={() => setNetwork(n)}
              className={cn(
                "rounded-[6px] px-2.5 py-1 text-[12px] font-medium capitalize transition-colors",
                network === n
                  ? "bg-white/[0.07] text-ink"
                  : "text-faint hover:text-muted",
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <ConnectButton />
      </div>
    </header>
  );
}

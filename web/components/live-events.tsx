"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Radio } from "lucide-react";
import { shortAddr } from "@/lib/utils";

interface WalletEvent {
  id: string;
  ledger: number;
  direction: "in" | "out";
  counterparty: string;
  amount: number;
  txHash: string;
}

/** Polls Soroban getEvents for live token movements on a wallet. */
export function LiveEvents({ wallet }: { wallet: string }) {
  const [events, setEvents] = useState<WalletEvent[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`/api/events?wallet=${wallet}`, { cache: "no-store" });
        const data = (await r.json()) as { events: WalletEvent[] };
        if (alive) {
          setEvents(data.events.slice(0, 6));
          setLive(true);
        }
      } catch {
        if (alive) setLive(false);
      }
    };
    tick();
    const id = setInterval(tick, 6000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [wallet]);

  return (
    <div className="reveal panel overflow-hidden" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-signal" />
          <h2 className="text-[15px] text-ink">Live on-chain events</h2>
          <span
            className={`h-1.5 w-1.5 rounded-full ${live ? "pulse-dot bg-positive" : "bg-faint"}`}
          />
        </div>
        <span className="font-mono text-[11px] text-faint">getEvents · 6s</span>
      </div>

      {events.length ? (
        <div className="divide-y divide-line">
          {events.map((e) => (
            <div
              key={e.id}
              className="reveal flex items-center gap-3.5 px-5 py-3"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                  e.direction === "out"
                    ? "border-danger/25 bg-danger/10"
                    : "border-positive/25 bg-positive/10"
                }`}
              >
                {e.direction === "out" ? (
                  <ArrowUpRight className="h-4 w-4 text-danger" />
                ) : (
                  <ArrowDownLeft className="h-4 w-4 text-positive" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] text-ink">
                  {e.direction === "out" ? "Sent" : "Received"}{" "}
                  <span className="tnum font-mono">{e.amount.toFixed(2)}</span> XLM
                </p>
                <p className="font-mono text-[11.5px] text-faint">
                  {e.direction === "out" ? "to" : "from"} {shortAddr(e.counterparty, 5, 5)}
                </p>
              </div>
              <span className="font-mono text-[11px] text-faint">
                ledger {e.ledger.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-[12.5px] text-faint">
          {live ? "No recent token movements for this wallet." : "Connecting to RPC…"}
        </p>
      )}
    </div>
  );
}

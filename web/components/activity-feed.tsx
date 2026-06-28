"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ActivityRow } from "@/components/activity-row";
import { shortAddr } from "@/lib/utils";
import type { ActivityEvent } from "@/lib/data";

interface WalletEvent {
  id: string;
  ledger: number;
  at: string;
  direction: "in" | "out";
  counterparty: string;
  amount: number;
  txHash: string;
}

function toActivity(
  e: WalletEvent,
  agentId: string,
  agentName: string,
): ActivityEvent {
  const sent = e.direction === "out";
  return {
    id: `live-${e.id}`,
    kind: "transfer",
    status: "approved",
    agentId,
    agentName,
    summary: `${sent ? "Sent" : "Received"} ${e.amount.toFixed(2)} XLM`,
    token: "XLM",
    to: shortAddr(e.counterparty, 5, 5),
    txHash: shortAddr(e.txHash, 4, 4),
    at: e.at,
  };
}

/**
 * One unified feed: live on-chain token movements (Soroban getEvents) merged
 * with the recorded activity log, newest first.
 */
export function ActivityFeed({
  seeded,
  wallet,
  agentId,
  agentName,
  limit = 7,
}: {
  seeded: ActivityEvent[];
  wallet?: string;
  agentId: string;
  agentName: string;
  limit?: number;
}) {
  const [live, setLive] = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!wallet) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`/api/events?wallet=${wallet}`, { cache: "no-store" });
        const data = (await r.json()) as { events: WalletEvent[] };
        if (alive) {
          setLive(data.events.map((e) => toActivity(e, agentId, agentName)));
          setConnected(true);
        }
      } catch {
        if (alive) setConnected(false);
      }
    };
    tick();
    const id = setInterval(tick, 6000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [wallet, agentId, agentName]);

  const merged = [...live, ...seeded]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);

  return (
    <div className="reveal panel overflow-hidden" style={{ animationDelay: "240ms" }}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[15px] text-ink">Activity</h2>
          <span className="flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? "pulse-dot bg-positive" : "bg-faint"
              }`}
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
              {connected ? "live" : "offline"}
            </span>
          </span>
        </div>
        <Link
          href="/activity"
          className="flex items-center gap-1.5 font-mono text-[12px] text-muted transition-colors hover:text-ink"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="divide-y divide-line">
        {merged.map((e) => (
          <ActivityRow key={e.id} e={e} />
        ))}
      </div>
    </div>
  );
}

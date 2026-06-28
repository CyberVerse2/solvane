import Link from "next/link";
import { ArrowRight, ShieldCheck, Ban, Gauge } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { SpendChart } from "@/components/spend-chart";
import { ActivityFeed } from "@/components/activity-feed";
import { CreateAgentDrawer } from "@/components/create-agent-drawer";
import { Eyebrow } from "@/components/ui";
import { activity, totals } from "@/lib/data";
import { getAllAgents } from "@/lib/agents-store";
import { fmtAmount } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const agents = await getAllAgents();
  const liveAgent = agents.find((a) => a.deployed);
  return (
    <>
      <PageHeader
        eyebrow="Console"
        title="Overview"
        subtitle="Every agent wallet and every transaction it attempts, governed by on-chain policy."
        action={<CreateAgentDrawer />}
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile
          index={0}
          label="Assets under management"
          value={`$${fmtAmount(totals.tvlUsd)}`}
          delta={{ value: "4.2%", up: true }}
          accent
        />
        <StatTile
          index={1}
          label="Active agents"
          value={String(totals.activeAgents)}
          unit={`/ ${totals.agents}`}
        />
        <StatTile
          index={2}
          label="Spend · 24h"
          value={`$${fmtAmount(totals.spend24hUsd)}`}
          delta={{ value: "11%", up: true, good: true }}
        />
        <StatTile
          index={3}
          label="Blocked · 24h"
          value={String(totals.blocked24h)}
          delta={{ value: "9", up: true, good: true }}
        />
      </div>

      {/* Chart + posture */}
      <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div
          className="reveal panel col-span-1 p-5 lg:col-span-2"
          style={{ animationDelay: "120ms" }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <Eyebrow>Transaction flow</Eyebrow>
              <h2 className="mt-1 text-[17px] text-ink">Approved vs. blocked · 24h</h2>
            </div>
            <div className="flex items-center gap-4">
              <Legend color="bg-signal" label="Approved" />
              <Legend color="bg-danger" label="Blocked" />
            </div>
          </div>
          <SpendChart />
        </div>

        <div className="reveal panel p-5" style={{ animationDelay: "180ms" }}>
          <Eyebrow>Policy posture</Eyebrow>
          <h2 className="mt-1 text-[17px] text-ink">Guardrails</h2>
          <div className="mt-5 space-y-4">
            <Posture
              icon={<ShieldCheck className="h-4 w-4 text-signal" />}
              label="Allowlist enforced"
              value="3 of 4 agents"
              bar={75}
            />
            <Posture
              icon={<Gauge className="h-4 w-4 text-info" />}
              label="Within spend limits"
              value="98.7%"
              bar={98}
            />
            <Posture
              icon={<Ban className="h-4 w-4 text-danger" />}
              label="Blocked this week"
              value="37 attempts"
              bar={26}
              danger
            />
          </div>
          <Link
            href="/policies"
            className="mt-5 flex items-center gap-1.5 font-mono text-[12px] text-muted transition-colors hover:text-signal"
          >
            Manage policies <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Unified activity — live on-chain events merged with the recorded log */}
      <div className="mt-3.5">
        <ActivityFeed
          seeded={activity}
          wallet={liveAgent?.address}
          agentId={liveAgent?.id ?? "vega"}
          agentName={liveAgent?.name ?? "Vega"}
        />
      </div>

      <p className="mt-5 text-center font-mono text-[11px] text-faint">
        {agents.length} agents · {totals.tx24h.toLocaleString()} transactions in the
        last 24h · Stellar testnet
      </p>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-muted">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function Posture({
  icon,
  label,
  value,
  bar,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bar: number;
  danger?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] text-muted">
          {icon}
          {label}
        </span>
        <span className="tnum font-mono text-[12px] text-ink">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className={`h-full rounded-full ${danger ? "bg-danger/70" : "bg-signal/80"}`}
          style={{ width: `${bar}%` }}
        />
      </div>
    </div>
  );
}

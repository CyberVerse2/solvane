import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Wallet,
  KeyRound,
  ShieldCheck,
  Snowflake,
  ExternalLink,
} from "lucide-react";
import { Badge, Button, Copyable, Eyebrow } from "@/components/ui";
import { ActivityRow } from "@/components/activity-row";
import { activity, type WalletStatus } from "@/lib/data";
import { findAgent } from "@/lib/agents-store";
import { readWalletState } from "@/lib/stellar";
import { canSignFor } from "@/lib/write";
import { LimitEditor } from "@/components/limit-editor";
import { fmtAmount, shortAddr } from "@/lib/utils";

const statusTone: Record<WalletStatus, "positive" | "warning" | "danger"> = {
  active: "positive",
  paused: "warning",
  frozen: "danger",
};

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = findAgent(id);
  if (!agent) notFound();

  const live =
    agent.deployed && agent.ownerPubkeyHex
      ? await readWalletState(agent.address, agent.ownerPubkeyHex)
      : null;
  const writable = canSignFor(agent.ownerPubkeyHex);

  const events = activity.filter((e) => e.agentId === id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/agents"
        className="reveal mb-5 inline-flex items-center gap-1.5 font-mono text-[12px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All agents
      </Link>

      {/* Header */}
      <div className="reveal mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-gradient-to-br from-white/[0.08] to-transparent font-display text-[24px] font-semibold text-ink">
            {agent.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[26px] leading-none text-ink">{agent.name}</h1>
              <Badge tone={statusTone[agent.status]} dot>
                {agent.status}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Copyable value={agent.address} display={shortAddr(agent.address, 6, 6)} />
              <span className="font-mono text-[12px] text-faint">{agent.model}</span>
              {agent.deployed && (
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-signal">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-signal" />
                  live · testnet
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Button variant="default">
            <Wallet className="h-4 w-4" /> Fund
          </Button>
          <Button variant="danger">
            <Snowflake className="h-4 w-4" /> Freeze
          </Button>
        </div>
      </div>

      {/* Top stats */}
      <div className="reveal grid grid-cols-2 gap-3.5 sm:grid-cols-4" style={{ animationDelay: "60ms" }}>
        <Mini label="Balance" value={`$${fmtAmount(agent.balanceUsd)}`} accent />
        <Mini label="Spend · 24h" value={`$${fmtAmount(agent.spend24hUsd)}`} />
        <Mini label="Transactions" value={agent.txCount.toLocaleString()} />
        <Mini label="Signers" value={String(agent.signers.length)} />
      </div>

      {/* Live on-chain state — read directly from Soroban via simulation */}
      {agent.deployed && (
        <div
          className="reveal mt-3.5 overflow-hidden rounded-lg border border-signal/25 bg-signal-soft/40 p-4"
          style={{ animationDelay: "90ms" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-signal">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-signal" />
              On-chain state
            </span>
            <span className="font-mono text-[11px] text-muted">
              {live ? `ledger ${live.ledger.toLocaleString()}` : "rpc unreachable"}
            </span>
          </div>
          {live ? (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                <OnchainStat label="Owner role" value={live.ownerRole ?? "—"} mono />
                <OnchainStat
                  label="Allowlist"
                  value={live.allowlistEnforced ? "enforced" : "open"}
                  mono
                />
                <OnchainStat
                  label="Balance (XLM)"
                  value={`${live.nativeBalance.toFixed(2)}`}
                  mono
                />
                <OnchainStat
                  label="Limit / tx (XLM)"
                  value={live.nativeLimit ? `${live.nativeLimit.toFixed(0)}` : "unset"}
                  mono
                />
              </div>
              {writable && (
                <div className="mt-4 flex items-center justify-between border-t border-signal/15 pt-3">
                  <span className="font-mono text-[11px] text-muted">
                    Write a new per-transfer cap — signed by the owner key, enforced
                    in __check_auth
                  </span>
                  <LimitEditor wallet={agent.address} current={live.nativeLimit} />
                </div>
              )}
            </>
          ) : (
            <p className="text-[12.5px] text-muted">
              Couldn&apos;t reach Soroban RPC to read this contract. The cached
              configuration below may be stale.
            </p>
          )}
        </div>
      )}

      <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {/* Signers */}
        <Section
          title="Signers"
          icon={<KeyRound className="h-4 w-4 text-signal" />}
          action={
            <Button variant="ghost" className="px-2 py-1 text-[12px]">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          }
          delay={120}
        >
          <div className="divide-y divide-line">
            {agent.signers.map((s) => (
              <div key={s.pubkey} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[13.5px] text-ink">{s.label}</p>
                  <p className="font-mono text-[12px] text-faint">{s.pubkey}</p>
                </div>
                <Badge tone={s.role === "admin" ? "signal" : "muted"}>{s.role}</Badge>
              </div>
            ))}
          </div>
        </Section>

        {/* Limits */}
        <Section
          title="Spend limits"
          icon={<ShieldCheck className="h-4 w-4 text-info" />}
          action={
            <Button variant="ghost" className="px-2 py-1 text-[12px]">
              Edit
            </Button>
          }
          delay={180}
        >
          <div className="space-y-4 p-4">
            {agent.limits.map((l) => {
              const pct = Math.min(100, (l.spent24h / l.maxPerTransfer) * 100);
              const near = pct > 80;
              return (
                <div key={l.symbol}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13.5px] text-ink">
                      <span className="font-mono text-[11px] text-faint">{l.symbol}</span>
                      max ${fmtAmount(l.maxPerTransfer)}/tx
                    </span>
                    <span className="tnum font-mono text-[12px] text-muted">
                      ${fmtAmount(l.spent24h)} today
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className={`h-full rounded-full ${near ? "bg-warning" : "bg-signal/80"}`}
                      style={{ width: `${Math.max(3, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Allowlist */}
        <Section
          title="Recipient allowlist"
          icon={<ShieldCheck className="h-4 w-4 text-signal" />}
          action={
            <Badge tone={agent.allowlistEnforced ? "signal" : "muted"} dot>
              {agent.allowlistEnforced ? "enforced" : "open"}
            </Badge>
          }
          delay={240}
        >
          {agent.recipients.length ? (
            <div className="divide-y divide-line">
              {agent.recipients.map((r) => (
                <div key={r.address} className="flex items-center justify-between px-4 py-3">
                  <span className="text-[13.5px] text-ink">{r.label}</span>
                  <Copyable value={r.address} display={r.address} />
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-[13px] text-faint">
              No allowlist — transfers to any recipient are permitted within limits.
            </p>
          )}
        </Section>

        {/* Activity */}
        <Section title="Activity" icon={<ExternalLink className="h-4 w-4 text-muted" />} delay={300}>
          {events.length ? (
            <div className="divide-y divide-line">
              {events.map((e) => (
                <ActivityRow key={e.id} e={e} />
              ))}
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-[13px] text-faint">No activity yet.</p>
          )}
        </Section>
      </div>
    </div>
  );
}

function OnchainStat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
        {label}
      </p>
      <p className={`mt-1 text-[14px] text-ink ${mono ? "font-mono capitalize" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="panel p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{label}</p>
      <p
        className={`tnum mt-2 font-display text-[22px] font-semibold leading-none ${
          accent ? "text-signal" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Section({
  title,
  icon,
  action,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div className="reveal panel overflow-hidden" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-[14px] text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

import Link from "next/link";
import { ArrowUpRight, ShieldCheck, ShieldOff } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CreateAgentDrawer } from "@/components/create-agent-drawer";
import { Badge } from "@/components/ui";
import { Copyable } from "@/components/ui";
import { type WalletStatus } from "@/lib/data";
import { getAllAgents } from "@/lib/agents-store";
import { fmtAmount, shortAddr } from "@/lib/utils";

const statusTone: Record<WalletStatus, "positive" | "warning" | "danger"> = {
  active: "positive",
  paused: "warning",
  frozen: "danger",
};

export default function AgentsPage() {
  const agents = getAllAgents();
  return (
    <>
      <PageHeader
        eyebrow={`${agents.length} wallets`}
        title="Agents"
        subtitle="Each agent owns a Soroban smart-account. Tap one to manage signers, limits and the allowlist."
        action={<CreateAgentDrawer />}
      />

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((a, i) => (
          <Link
            key={a.id}
            href={`/agents/${a.id}`}
            className="reveal panel group relative overflow-hidden p-5 transition-colors hover:border-line-strong"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-gradient-to-br from-white/[0.06] to-transparent font-display text-[18px] font-semibold text-ink">
                  {a.name[0]}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[16px] font-medium text-ink">
                    {a.name}
                    <ArrowUpRight className="h-3.5 w-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                  </p>
                  <p className="flex items-center gap-1.5 font-mono text-[12px] text-faint">
                    @{a.handle}
                    {a.deployed && (
                      <span className="text-signal" title="Live on testnet">
                        · live
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Badge tone={statusTone[a.status]} dot>
                {a.status}
              </Badge>
            </div>

            {/* balance */}
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                  Balance
                </p>
                <p className="tnum mt-1 font-display text-[26px] font-semibold leading-none text-ink">
                  ${fmtAmount(a.balanceUsd)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                  24h spend
                </p>
                <p className="tnum mt-1 font-mono text-[15px] text-muted">
                  ${fmtAmount(a.spend24hUsd)}
                </p>
              </div>
            </div>

            {/* footer */}
            <div className="mt-5 flex items-center justify-between border-t border-line pt-3.5">
              <Copyable value={a.address} display={shortAddr(a.address, 5, 5)} />
              <span className="flex items-center gap-1.5 text-[12px] text-muted">
                {a.allowlistEnforced ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-signal" /> Allowlist
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-3.5 w-3.5 text-faint" /> Open
                  </>
                )}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

import Link from "next/link";
import { ShieldCheck, ShieldOff, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, Eyebrow } from "@/components/ui";
import { agents } from "@/lib/data";
import { fmtAmount } from "@/lib/utils";

export default function PoliciesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Guardrails"
        title="Policies"
        subtitle="Spend limits and allowlists are enforced inside the contract's __check_auth — a leaked session key still can't break them."
      />

      <div className="reveal panel overflow-hidden">
        <div className="hidden grid-cols-[1.2fr_1fr_1.4fr_0.8fr_32px] items-center gap-4 border-b border-line px-5 py-3 md:grid">
          {["Agent", "Allowlist", "Per-transfer limits", "Blocked 7d", ""].map((h) => (
            <Eyebrow key={h}>{h}</Eyebrow>
          ))}
        </div>
        <div className="divide-y divide-line">
          {agents.map((a, i) => (
            <Link
              key={a.id}
              href={`/agents/${a.id}`}
              className="grid grid-cols-1 items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[1.2fr_1fr_1.4fr_0.8fr_32px]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white/[0.03] font-display text-[15px] text-ink">
                  {a.name[0]}
                </span>
                <div>
                  <p className="text-[14px] font-medium text-ink">{a.name}</p>
                  <p className="font-mono text-[11.5px] text-faint">@{a.handle}</p>
                </div>
              </div>

              <div>
                {a.allowlistEnforced ? (
                  <Badge tone="signal">
                    <ShieldCheck className="h-3 w-3" /> enforced
                  </Badge>
                ) : (
                  <Badge tone="muted">
                    <ShieldOff className="h-3 w-3" /> open
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {a.limits.map((l) => (
                  <span
                    key={l.symbol}
                    className="rounded-md border border-line px-2 py-0.5 font-mono text-[11.5px] text-muted"
                  >
                    {l.symbol} ${fmtAmount(l.maxPerTransfer, 0)}
                  </span>
                ))}
              </div>

              <span className="tnum font-mono text-[13px] text-muted">
                {(i * 11 + 3) % 40}
              </span>

              <ChevronRight className="h-4 w-4 justify-self-end text-faint" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import {
  ArrowUpRight,
  Ban,
  SlidersHorizontal,
  KeyRound,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import type { ActivityEvent } from "@/lib/data";

const meta: Record<
  ActivityEvent["kind"],
  { icon: LucideIcon; ring: string; fg: string }
> = {
  transfer: { icon: ArrowUpRight, ring: "border-positive/25 bg-positive/10", fg: "text-positive" },
  blocked: { icon: Ban, ring: "border-danger/25 bg-danger/10", fg: "text-danger" },
  policy: { icon: SlidersHorizontal, ring: "border-info/25 bg-info/10", fg: "text-info" },
  signer: { icon: KeyRound, ring: "border-signal/25 bg-signal-soft", fg: "text-signal" },
  created: { icon: Sparkles, ring: "border-line-strong bg-white/[0.04]", fg: "text-muted" },
};

export function ActivityRow({ e }: { e: ActivityEvent }) {
  const m = meta[e.kind];
  const Icon = m.icon;
  return (
    <div className="group flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-white/[0.02]">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${m.ring}`}
      >
        <Icon className={`h-4 w-4 ${m.fg}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] text-ink">{e.summary}</p>
        <p className="truncate text-[12px] text-faint">
          <Link href={`/agents/${e.agentId}`} className="text-muted hover:text-ink">
            {e.agentName}
          </Link>
          {e.detail && <span> · {e.detail}</span>}
          {e.to && !e.detail && <span> · to {e.to}</span>}
        </p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        {e.amountUsd !== undefined && (
          <p
            className={`tnum font-mono text-[13px] ${
              e.status === "blocked" ? "text-danger" : "text-ink"
            }`}
          >
            {e.status === "blocked" ? "" : "−"}${e.amountUsd.toLocaleString()}
          </p>
        )}
        {e.txHash && (
          <p className="font-mono text-[11px] text-faint">{e.txHash}</p>
        )}
      </div>

      <div className="hidden w-20 shrink-0 text-right md:block">
        <Badge tone={e.status === "blocked" ? "danger" : e.status === "pending" ? "warning" : "positive"}>
          {e.status}
        </Badge>
      </div>

      <span className="w-14 shrink-0 text-right font-mono text-[11px] text-faint">
        {timeAgo(e.at)}
      </span>
    </div>
  );
}

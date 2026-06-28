"use client";

import { useState } from "react";
import { ActivityRow } from "@/components/activity-row";
import { PageHeader } from "@/components/page-header";
import { activity } from "@/lib/data";
import { cn } from "@/lib/utils";

const filters = [
  { key: "all", label: "All" },
  { key: "transfer", label: "Transfers" },
  { key: "blocked", label: "Blocked" },
  { key: "policy", label: "Policy" },
  { key: "signer", label: "Signers" },
] as const;

export default function ActivityPage() {
  const [active, setActive] = useState<(typeof filters)[number]["key"]>("all");

  const rows = activity.filter((e) => active === "all" || e.kind === active);

  return (
    <>
      <PageHeader
        eyebrow="Audit log"
        title="Activity"
        subtitle="A complete, immutable record of every action across your agent fleet."
      />

      <div className="reveal mb-4 flex flex-wrap items-center gap-1.5">
        {filters.map((f) => {
          const count =
            f.key === "all"
              ? activity.length
              : activity.filter((e) => e.kind === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] transition-colors",
                active === f.key
                  ? "border-line-strong bg-white/[0.05] text-ink"
                  : "border-line text-muted hover:text-ink",
              )}
            >
              {f.label}
              <span className="font-mono text-[11px] text-faint">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="reveal panel overflow-hidden" style={{ animationDelay: "80ms" }}>
        <div className="divide-y divide-line">
          {rows.map((e) => (
            <ActivityRow key={e.id} e={e} />
          ))}
          {!rows.length && (
            <p className="px-4 py-10 text-center text-[13px] text-faint">
              No events for this filter.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

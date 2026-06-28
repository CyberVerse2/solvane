import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  unit,
  delta,
  accent,
  index = 0,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: { value: string; up: boolean; good?: boolean };
  accent?: boolean;
  index?: number;
}) {
  return (
    <div
      className="reveal panel group relative overflow-hidden p-4"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {accent && (
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/60 to-transparent" />
      )}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
          {label}
        </span>
        {delta && (
          <span
            className={cn(
              "flex items-center gap-0.5 font-mono text-[11px]",
              delta.good ?? delta.up ? "text-positive" : "text-danger",
            )}
          >
            {delta.up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta.value}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className={cn(
            "tnum font-display text-[30px] font-semibold leading-none tracking-tight",
            accent ? "text-signal" : "text-ink",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-[13px] text-muted">{unit}</span>}
      </div>
    </div>
  );
}

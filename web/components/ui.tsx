"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Status badge ─────────────────────────────────────────── */
type Tone = "signal" | "positive" | "warning" | "danger" | "muted" | "info";

const toneStyles: Record<Tone, string> = {
  signal: "text-signal bg-signal-soft border-signal/25",
  positive: "text-positive bg-positive/10 border-positive/20",
  warning: "text-warning bg-warning/10 border-warning/20",
  danger: "text-danger bg-danger/10 border-danger/20",
  info: "text-info bg-info/10 border-info/20",
  muted: "text-muted bg-white/[0.04] border-line",
};

export function Badge({
  tone = "muted",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        toneStyles[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ── Copyable mono value ──────────────────────────────────── */
export function Copyable({
  value,
  display,
  className,
}: {
  value: string;
  display?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className={cn(
        "group inline-flex items-center gap-1.5 font-mono text-[13px] text-muted transition-colors hover:text-ink",
        className,
      )}
      title={value}
    >
      {display ?? value}
      {copied ? (
        <Check className="h-3.5 w-3.5 text-signal" />
      ) : (
        <Copy className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
      )}
    </button>
  );
}

/* ── Button ───────────────────────────────────────────────── */
export function Button({
  children,
  variant = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
}) {
  const variants = {
    primary:
      "bg-signal text-[#0a0b0d] hover:bg-signal/90 font-semibold border border-signal",
    default:
      "bg-white/[0.03] text-ink hover:bg-white/[0.07] border border-line-strong",
    ghost: "text-muted hover:text-ink hover:bg-white/[0.04] border border-transparent",
    danger:
      "bg-danger/10 text-danger hover:bg-danger/15 border border-danger/25",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm transition-all active:scale-[0.98] disabled:opacity-40",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── Section heading ──────────────────────────────────────── */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
      {children}
    </span>
  );
}

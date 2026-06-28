import { cn } from "@/lib/utils";

/** Solvane mark — a three-blade vane: direction + motion for autonomous money. */
export function SolvaneMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("h-7 w-7", className)} aria-hidden>
      <g transform="translate(16 16)">
        {[0, 120, 240].map((deg, i) => (
          <path
            key={deg}
            d="M0 -2 L11 -5 L9.5 1.5 L1.5 2 Z"
            transform={`rotate(${deg})`}
            fill="var(--color-signal)"
            opacity={1 - i * 0.26}
          />
        ))}
        <circle r="2.6" fill="#08090b" stroke="var(--color-signal)" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

export function SolvaneLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <SolvaneMark />
      <span className="font-display text-[19px] font-semibold tracking-tight text-ink">
        Solvane
      </span>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ArrowRight, Loader2 } from "lucide-react";
import { useWallet } from "@/components/wallet-provider";
import { cn } from "@/lib/utils";

/**
 * Sign-up CTA. "Signing up" to Solvane = connecting your operator wallet; on
 * success we drop the user straight into the console.
 */
export function GetStartedButton({
  size = "md",
  variant = "primary",
  className,
}: {
  size?: "md" | "lg";
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const router = useRouter();
  const { address, connect, connecting, error } = useWallet();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (pending && address) router.push("/dashboard");
  }, [pending, address, router]);

  async function go() {
    if (address) {
      router.push("/dashboard");
      return;
    }
    setPending(true);
    await connect();
  }

  const sizes = {
    md: "px-4 py-2.5 text-[14px]",
    lg: "px-6 py-3.5 text-[15px]",
  };
  const variants = {
    primary: "bg-signal text-[#08090b] hover:bg-signal/90 font-semibold",
    ghost: "border border-line-strong text-ink hover:bg-white/[0.04]",
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={go}
        disabled={connecting}
        className={cn(
          "group inline-flex items-center justify-center gap-2 rounded-xl transition-all active:scale-[0.98] disabled:opacity-60",
          sizes[size],
          variants[variant],
          className,
        )}
      >
        {connecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
          </>
        ) : address ? (
          <>
            Launch console
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" /> Connect wallet
          </>
        )}
      </button>
      {pending && error && (
        <span className="font-mono text-[11px] text-danger">{error}</span>
      )}
    </div>
  );
}

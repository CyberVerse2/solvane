"use client";

import Link from "next/link";
import { SolvaneLogo } from "@/components/logo";
import { GetStartedButton } from "@/components/get-started-button";
import { useWallet } from "@/components/wallet-provider";
import { shortAddr } from "@/lib/utils";

const links = [
  { href: "#features", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#developers", label: "Developers" },
  { href: "/docs", label: "Docs" },
];

export function LandingNav() {
  const { address } = useWallet();

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
        <Link href="/">
          <SolvaneLogo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13.5px] text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {address && (
            <span className="hidden font-mono text-[12px] text-faint sm:block">
              {shortAddr(address, 4, 4)}
            </span>
          )}
          <GetStartedButton size="md" />
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Activity,
  KeyRound,
  Settings,
  ShieldCheck,
  BookText,
} from "lucide-react";
import { SolvaneLogo } from "@/components/logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/policies", label: "Policies", icon: ShieldCheck },
  { href: "/keys", label: "API Keys", icon: KeyRound },
];

const footerNav = [
  { href: "/docs", label: "Documentation", icon: BookText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col border-r border-line bg-panel/60 px-3 py-5 backdrop-blur-xl lg:flex">
      <div className="px-2.5 pb-6">
        <Link href="/">
          <SolvaneLogo />
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors",
                active ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-signal" />
              )}
              <span
                className={cn(
                  "absolute inset-0 rounded-lg border transition-colors",
                  active
                    ? "border-line-strong bg-white/[0.04]"
                    : "border-transparent group-hover:bg-white/[0.025]",
                )}
              />
              <Icon
                className={cn(
                  "relative h-[17px] w-[17px] transition-colors",
                  active ? "text-signal" : "text-faint group-hover:text-muted",
                )}
              />
              <span className="relative font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5">
        {footerNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] text-muted transition-colors hover:bg-white/[0.025] hover:text-ink"
          >
            <Icon className="h-[17px] w-[17px] text-faint" />
            <span className="font-medium">{label}</span>
          </Link>
        ))}

        <div className="mt-3 flex items-center gap-3 rounded-lg border border-line px-2.5 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-signal/30 to-info/20 font-mono text-xs font-semibold text-ink">
            CE
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-medium text-ink">Celestine</p>
            <p className="truncate font-mono text-[11px] text-faint">Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

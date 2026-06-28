"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Bot,
  Activity,
  KeyRound,
  ShieldCheck,
  Settings,
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
  { href: "/docs", label: "Documentation", icon: BookText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  // Close the drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-ink lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="reveal absolute left-0 top-0 h-full w-[264px] border-r border-line-strong bg-panel p-4">
              <div className="flex items-center justify-between px-1.5 pb-5">
                <SolvaneLogo />
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-line p-1.5 text-muted hover:text-ink"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex flex-col gap-0.5">
                {nav.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-2.5 py-2.5 text-[14px] transition-colors",
                        active
                          ? "border-line-strong bg-white/[0.05] text-ink"
                          : "border-transparent text-muted hover:text-ink",
                      )}
                    >
                      <Icon
                        className={cn("h-[18px] w-[18px]", active ? "text-signal" : "text-faint")}
                      />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

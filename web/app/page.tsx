import Link from "next/link";
import {
  ShieldCheck,
  Fuel,
  Wallet,
  Radio,
  Plug,
  GitBranch,
  ArrowRight,
  Check,
  Ban,
} from "lucide-react";
import { SolvaneLogo, SolvaneMark } from "@/components/logo";
import { LandingNav } from "@/components/landing-nav";
import { GetStartedButton } from "@/components/get-started-button";
import { Eyebrow } from "@/components/ui";

const wallets = ["Freighter", "xBull", "Albedo", "Rabet", "Hana", "LOBSTR"];

const features = [
  {
    icon: ShieldCheck,
    title: "On-chain policy",
    body: "Spend limits, token caps and recipient allowlists are enforced inside the contract's authorization path — a leaked agent key still can't break them.",
  },
  {
    icon: Fuel,
    title: "Gasless for agents",
    body: "A relayer pays every fee. Agent wallets start with zero XLM, so you can provision thousands without funding any of them.",
  },
  {
    icon: Plug,
    title: "Multi-wallet sign-in",
    body: "Sign in as the operator with Freighter, xBull, Albedo, Rabet, Hana or LOBSTR. One identity to provision and fund your fleet.",
  },
  {
    icon: Radio,
    title: "Real-time control",
    body: "Stream every transaction live, watch policy approvals and blocks as they happen, and freeze any wallet instantly.",
  },
];

const steps = [
  {
    n: "01",
    title: "Connect your wallet",
    body: "Sign in as the operator — the human who owns and funds the agents.",
  },
  {
    n: "02",
    title: "Provision agent wallets",
    body: "Deploy a Soroban smart account per agent in two ledgers. No XLM required.",
  },
  {
    n: "03",
    title: "Set policy & go",
    body: "Define limits and allowlists. Agents transact freely — but only within the rules.",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen">
      {/* Atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0 grid-bg" />
      <div className="pointer-events-none fixed inset-0 z-0 canvas-atmos" />

      <div className="relative z-10">
        <LandingNav />

        {/* ── Hero ── */}
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-16 lg:px-8 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="reveal">
              <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-signal" />
                Wallet infrastructure for AI agents
              </span>

              <h1 className="mt-6 font-display text-[clamp(2.6rem,6vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-ink">
                Give your agents a wallet they{" "}
                <span className="text-signal">can&apos;t misuse.</span>
              </h1>

              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-muted">
                Provision a Stellar smart wallet for every agent and govern every
                transaction with on-chain policy — spend limits, allowlists, and a
                kill-switch. Connect your wallet to start in seconds.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <GetStartedButton size="lg" />
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-6 py-3.5 text-[15px] text-ink transition-colors hover:bg-white/[0.04]"
                >
                  Read the docs <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-5 font-mono text-[12px] text-faint">
                Live on Stellar testnet · no credit card · sign in with your wallet
              </p>
            </div>

            {/* Policy card mockup */}
            <PolicyCard />
          </div>

          {/* Wallets strip */}
          <div className="reveal mt-16 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-line pt-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              Sign in with
            </span>
            {wallets.map((w) => (
              <span key={w} className="font-display text-[15px] text-muted">
                {w}
              </span>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <SectionHead
            eyebrow="Why Solvane"
            title="Autonomy with guardrails"
            sub="Everything an agent needs to hold and move value — and everything you need to make sure it never goes off the rails."
          />
          <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="panel p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white/[0.03]">
                  <f.icon className="h-5 w-5 text-signal" />
                </div>
                <h3 className="mt-4 text-[16px] text-ink">{f.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <SectionHead
            eyebrow="How it works"
            title="From wallet to fleet in three steps"
          />
          <div className="mt-10 grid gap-3.5 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="panel relative overflow-hidden p-6">
                <span className="font-mono text-[13px] text-signal">{s.n}</span>
                <h3 className="mt-3 text-[18px] text-ink">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Developers ── */}
        <section id="developers" className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Eyebrow>Developers</Eyebrow>
              <h2 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
                A wallet and its policy in one call.
              </h2>
              <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-muted">
                Provision a smart wallet, set its spend limits, and let your agent
                transact. The contract enforces the rest. Inter-contract calls,
                real-time events and a deployed Soroban contract — out of the box.
              </p>
              <div className="mt-7 flex items-center gap-2.5">
                <GitBranch className="h-4 w-4 text-faint" />
                <span className="font-mono text-[12.5px] text-muted">
                  Soroban · Stellar testnet · open SDK
                </span>
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-positive/60" />
                <span className="ml-2 font-mono text-[11px] text-faint">create-wallet.sh</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-muted">
{`curl https://api.solvane.dev/v1/wallets \\
  -H "Authorization: Bearer sk_live_…" \\
  -d '{
    "name": "Vega",
    "policy": {
      "limits": { "USDC": 250 },
      "allowlist": true
    }
  }'

`}
                <span className="text-signal">{`# → wallet deployed · policy enforced on-chain`}</span>
              </pre>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
          <div className="panel glow-signal relative overflow-hidden px-8 py-14 text-center">
            <div className="pointer-events-none absolute inset-0 canvas-atmos" />
            <div className="relative">
              <SolvaneMark className="mx-auto h-10 w-10" />
              <h2 className="mx-auto mt-5 max-w-2xl font-display text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
                Put your agents to work — safely.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] text-muted">
                Connect your wallet and provision your first agent wallet in under a
                minute.
              </p>
              <div className="mt-8 flex justify-center">
                <GetStartedButton size="lg" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row lg:px-8">
            <SolvaneLogo />
            <div className="flex items-center gap-6 font-mono text-[12px] text-faint">
              <Link href="#features" className="hover:text-muted">Product</Link>
              <Link href="/docs" className="hover:text-muted">Docs</Link>
              <span>Built on Stellar</span>
            </div>
            <span className="font-mono text-[11px] text-faint">© 2026 Solvane</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">
        {title}
      </h2>
      {sub && <p className="mt-4 text-[15px] leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

function PolicyCard() {
  return (
    <div className="reveal panel relative overflow-hidden p-5" style={{ animationDelay: "120ms" }}>
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <Wallet className="h-4 w-4 text-signal" />
          <span className="font-mono text-[12px] text-ink">agent · Vega</span>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-signal">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-signal" /> live
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        <PolicyLine ok summary="Paid 18.00 USDC" detail="to Perplexity API · within limit" />
        <PolicyLine ok summary="Paid 240.00 USDC" detail="to Modal compute · within limit" />
        <PolicyLine
          summary="Transfer 410.00 USDC"
          detail="blocked · over per-transfer cap of 250"
        />
        <PolicyLine
          summary="Transfer to GUNK…N0WN"
          detail="blocked · recipient not allowlisted"
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="font-mono text-[11px] text-faint">per-transfer cap</span>
        <span className="font-mono text-[12px] text-ink">250.00 USDC</span>
      </div>
    </div>
  );
}

function PolicyLine({
  ok,
  summary,
  detail,
}: {
  ok?: boolean;
  summary: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-bg/40 px-3 py-2.5">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
          ok ? "border-positive/25 bg-positive/10" : "border-danger/25 bg-danger/10"
        }`}
      >
        {ok ? (
          <Check className="h-3.5 w-3.5 text-positive" />
        ) : (
          <Ban className="h-3.5 w-3.5 text-danger" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] text-ink">{summary}</p>
        <p className="truncate font-mono text-[11px] text-faint">{detail}</p>
      </div>
    </div>
  );
}

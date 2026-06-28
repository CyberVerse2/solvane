import { PageHeader } from "@/components/page-header";
import { Eyebrow } from "@/components/ui";
import { BookText, Boxes, KeyRound, Webhook } from "lucide-react";

const sections = [
  {
    icon: Boxes,
    title: "Concepts",
    desc: "Smart accounts, signers, policy signers, and the relayer fee model.",
  },
  {
    icon: KeyRound,
    title: "Authentication",
    desc: "Create scoped API keys and call the Solvane API from your agent.",
  },
  {
    icon: BookText,
    title: "Wallet API",
    desc: "Provision wallets, set limits and allowlists, sign and submit transfers.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    desc: "Subscribe to approvals, blocks, and policy changes in real time.",
  },
];

export default function DocsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Developers"
        title="Documentation"
        subtitle="Everything you need to give an agent a wallet it can't misuse."
      />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {sections.map((s, i) => (
          <div
            key={s.title}
            className="reveal panel group cursor-pointer p-5 transition-colors hover:border-line-strong"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white/[0.03]">
              <s.icon className="h-5 w-5 text-signal" />
            </div>
            <h2 className="mt-4 text-[16px] text-ink">{s.title}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="reveal panel mt-3.5 p-5" style={{ animationDelay: "260ms" }}>
        <Eyebrow>Status</Eyebrow>
        <p className="mt-2 text-[13.5px] text-muted">
          Reference docs are being written alongside the public API. Smart-wallet
          contract, deploy and on-chain reads are live on testnet today.
        </p>
      </div>
    </>
  );
}

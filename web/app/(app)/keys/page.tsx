import { Plus, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Eyebrow } from "@/components/ui";
import { apiKeys } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

export default function KeysPage() {
  return (
    <>
      <PageHeader
        eyebrow="Credentials"
        title="API Keys"
        subtitle="Scoped, revocable keys your agents use to call the Solvane API. Rotate often."
        action={
          <Button variant="primary">
            <Plus className="h-4 w-4" /> Create key
          </Button>
        }
      />

      <div className="reveal panel overflow-hidden">
        <div className="hidden grid-cols-[1.4fr_1.6fr_1fr_0.8fr_40px] items-center gap-4 border-b border-line px-5 py-3 md:grid">
          {["Key", "Scopes", "Last used", "Created", ""].map((h) => (
            <Eyebrow key={h}>{h}</Eyebrow>
          ))}
        </div>

        <div className="divide-y divide-line">
          {apiKeys.map((k) => (
            <div
              key={k.id}
              className="grid grid-cols-1 items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[1.4fr_1.6fr_1fr_0.8fr_40px]"
            >
              <div>
                <p className="text-[14px] font-medium text-ink">{k.label}</p>
                <p className="font-mono text-[12.5px] text-muted">
                  {k.prefix}
                  <span className="text-faint">••••••••••••</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {k.scopes.map((s) => (
                  <Badge key={s} tone={s.endsWith(":write") ? "signal" : "muted"}>
                    {s}
                  </Badge>
                ))}
              </div>

              <span className="font-mono text-[12.5px] text-muted">
                {k.lastUsed ? timeAgo(k.lastUsed) : "—"}
              </span>
              <span className="font-mono text-[12.5px] text-faint">
                {timeAgo(k.createdAt)}
              </span>

              <button className="justify-self-end rounded-lg p-1.5 text-faint transition-colors hover:bg-white/[0.05] hover:text-ink">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="reveal panel mt-3.5 p-5" style={{ animationDelay: "120ms" }}>
        <Eyebrow>Quickstart</Eyebrow>
        <h2 className="mt-1.5 text-[16px] text-ink">Create a wallet from the API</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-bg/60 p-4 font-mono text-[12.5px] leading-relaxed text-muted">
{`curl https://api.solvane.dev/v1/wallets \\
  -H "Authorization: Bearer sk_live_…" \\
  -d '{
    "name": "Vega",
    "policy": {
      "limits": { "USDC": 250 },
      "allowlist": true
    }
  }'`}
        </pre>
      </div>
    </>
  );
}

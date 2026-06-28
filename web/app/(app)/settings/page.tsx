import { PageHeader } from "@/components/page-header";
import { Button, Copyable, Eyebrow } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Workspace" title="Settings" />

      <div className="space-y-3.5">
        <Card title="Organization">
          <Row label="Name" value="Acme Labs" />
          <Row label="Plan" value="Free · 4 / 10 agents" />
          <Row label="Members" value="2 seats" />
        </Card>

        <Card title="Relayer">
          <div className="px-5 py-4">
            <p className="text-[13px] text-muted">
              The account that submits transactions and pays fees on behalf of your
              agent wallets.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-bg/40 px-3.5 py-3">
              <Copyable
                value="GAHZHQ2PSDTSJI7MRAWNBDVGUJ5L25OCXIXRXZTOEJB72UDERE2NHORJ"
                display="GAHZ…HORJ"
              />
              <span className="font-mono text-[12px] text-positive">9,998.4 XLM</span>
            </div>
          </div>
        </Card>

        <Card title="Network">
          <Row label="Default" value="Testnet" />
          <Row label="Soroban RPC" value="soroban-testnet.stellar.org" mono />
          <Row label="Passphrase" value="Test SDF Network ; September 2015" mono />
        </Card>

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="ghost">Reset</Button>
          <Button variant="primary">Save changes</Button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="reveal panel overflow-hidden">
      <div className="border-b border-line px-5 py-3">
        <Eyebrow>{title}</Eyebrow>
      </div>
      <div className="divide-y divide-line">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-[13.5px] text-muted">{label}</span>
      <span className={`text-[13.5px] text-ink ${mono ? "font-mono text-[12.5px]" : ""}`}>
        {value}
      </span>
    </div>
  );
}

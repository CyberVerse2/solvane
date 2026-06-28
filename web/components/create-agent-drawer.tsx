"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, X, Check, Loader2, TriangleAlert, ExternalLink } from "lucide-react";
import { Button, Copyable } from "@/components/ui";
import { createWalletAction, type CreateWalletResult } from "@/app/actions";
import { cn, shortAddr } from "@/lib/utils";

const models = ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"];

export function CreateAgentDrawer() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  const [name, setName] = useState("");
  const [model, setModel] = useState(models[0]);
  const [limit, setLimit] = useState("250");
  const [allowlist, setAllowlist] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateWalletResult | null>(null);

  function reset() {
    setOpen(false);
    setTimeout(() => {
      setResult(null);
      setName("");
      setLimit("250");
      setSubmitting(false);
    }, 200);
  }

  async function deploy() {
    setSubmitting(true);
    const res = await createWalletAction({
      name,
      model,
      maxPerTransfer: Number(limit) || 0,
      allowlistEnforced: allowlist,
    });
    setResult(res);
    setSubmitting(false);
    if (res.ok) router.refresh();
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New agent wallet
      </Button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={reset} />
          <div className="reveal relative h-full w-full max-w-[440px] overflow-y-auto border-l border-line-strong bg-panel p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                  {result?.ok ? "Deployed" : "Provision"}
                </span>
                <h2 className="mt-1.5 text-[22px] text-ink">
                  {result?.ok ? "Wallet is live" : "New agent wallet"}
                </h2>
              </div>
              <button
                onClick={reset}
                className="rounded-lg border border-line p-1.5 text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SUCCESS */}
            {result?.ok ? (
              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-2.5 rounded-lg border border-signal/25 bg-signal-soft px-3.5 py-3">
                  <Check className="h-4 w-4 text-signal" />
                  <span className="text-[13px] text-ink">
                    Smart wallet deployed to testnet
                  </span>
                </div>

                <Readout label="Wallet address">
                  <Copyable value={result.address!} display={shortAddr(result.address!, 8, 8)} />
                </Readout>

                <Readout label="Owner secret · shown once">
                  <Copyable
                    value={result.ownerSecret!}
                    display={`${result.ownerSecret!.slice(0, 10)}••••••••`}
                  />
                  <p className="mt-2 flex items-start gap-1.5 text-[11.5px] text-warning">
                    <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                    In production this key never leaves the KMS. Store it now — it
                    won&apos;t be shown again.
                  </p>
                </Readout>

                {result.txHash && (
                  <Readout label="Deploy tx">
                    <span className="font-mono text-[12.5px] text-muted">
                      {shortAddr(result.txHash, 8, 8)}
                    </span>
                  </Readout>
                )}

                <div className="flex gap-2.5 pt-1">
                  <Button variant="primary" className="flex-1" onClick={reset}>
                    <ExternalLink className="h-4 w-4" /> View agents
                  </Button>
                </div>
              </div>
            ) : (
              /* FORM */
              <>
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  Deploys a Soroban smart-account on testnet. Fees are covered by the
                  relayer — the agent wallet starts with zero XLM.
                </p>

                <div className="mt-6 space-y-5">
                  <Field label="Agent name">
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vega"
                      className="w-full rounded-lg border border-line bg-bg/60 px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-faint focus:border-signal/40"
                    />
                  </Field>

                  <Field label="Model">
                    <div className="flex flex-wrap gap-2">
                      {models.map((m) => (
                        <button
                          key={m}
                          onClick={() => setModel(m)}
                          className={cn(
                            "rounded-lg border px-2.5 py-1.5 font-mono text-[12px] transition-colors",
                            model === m
                              ? "border-signal/40 bg-signal-soft text-signal"
                              : "border-line text-muted hover:text-ink",
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Per-transfer limit · USDC">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-faint">
                        $
                      </span>
                      <input
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        inputMode="decimal"
                        className="w-full rounded-lg border border-line bg-bg/60 py-2.5 pl-7 pr-3 font-mono text-[14px] text-ink outline-none focus:border-signal/40"
                      />
                    </div>
                  </Field>

                  <button
                    onClick={() => setAllowlist((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg border border-line px-3.5 py-3 text-left"
                  >
                    <div>
                      <p className="text-[13.5px] text-ink">Enforce recipient allowlist</p>
                      <p className="text-[12px] text-faint">
                        Block transfers to any address not explicitly allowed
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
                        allowlist ? "bg-signal" : "bg-white/10",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full bg-bg transition-transform",
                          allowlist && "translate-x-4",
                        )}
                      >
                        {allowlist && <Check className="h-2.5 w-2.5 text-signal" />}
                      </span>
                    </span>
                  </button>
                </div>

                {result && !result.ok && (
                  <p className="mt-4 flex items-start gap-1.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2.5 text-[12.5px] text-danger">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {result.error}
                  </p>
                )}

                <div className="mt-7 flex gap-2.5">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={deploy}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Deploying…
                      </>
                    ) : (
                      "Deploy wallet"
                    )}
                  </Button>
                  <Button variant="default" onClick={reset} disabled={submitting}>
                    Cancel
                  </Button>
                </div>

                <p className="mt-4 text-center font-mono text-[11px] text-faint">
                  ~2 ledgers · relayer pays fee
                </p>
              </>
            )}
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

function Readout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-bg/40 px-3.5 py-3">
      <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
        {label}
      </p>
      {children}
    </div>
  );
}

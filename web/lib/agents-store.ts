/**
 * Server-only registry of wallets created from the console, backed by Postgres.
 * Demo agents live in data.ts; anything deployed via "New agent wallet" is
 * persisted to the `agents` table and merged on top.
 *
 * If the database is unreachable, reads degrade gracefully to the demo agents
 * so the console still renders (local dev without Docker, etc.).
 */
import "server-only";
import { getPool, ensureSchema } from "./db";
import { agents as demoAgents, type Agent } from "./data";

export interface CreatedRecord {
  id: string;
  name: string;
  model: string;
  address: string;
  ownerPubkeyHex: string;
  maxPerTransfer: number;
  allowlistEnforced: boolean;
  createdAt: string;
}

export async function addCreatedAgent(rec: CreatedRecord): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO agents
       (id, name, model, address, owner_pubkey_hex, max_per_transfer, allowlist_enforced, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [
      rec.id,
      rec.name,
      rec.model,
      rec.address,
      rec.ownerPubkeyHex,
      rec.maxPerTransfer,
      rec.allowlistEnforced,
      rec.createdAt,
    ],
  );
}

interface AgentRow {
  id: string;
  name: string;
  model: string;
  address: string;
  owner_pubkey_hex: string;
  max_per_transfer: string;
  allowlist_enforced: boolean;
  created_at: Date;
}

async function readCreated(): Promise<CreatedRecord[]> {
  try {
    await ensureSchema();
    const { rows } = await getPool().query<AgentRow>(
      `SELECT * FROM agents ORDER BY created_at DESC`,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      model: r.model,
      address: r.address,
      ownerPubkeyHex: r.owner_pubkey_hex,
      maxPerTransfer: Number(r.max_per_transfer),
      allowlistEnforced: r.allowlist_enforced,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  } catch {
    return []; // DB unavailable → demo agents only
  }
}

function toAgent(r: CreatedRecord): Agent {
  return {
    id: r.id,
    name: r.name,
    handle: r.name.toLowerCase().replace(/\s+/g, "-"),
    address: r.address,
    status: "active",
    balanceUsd: 0,
    spend24hUsd: 0,
    txCount: 0,
    model: r.model,
    signers: [
      {
        label: "Owner key",
        pubkey: `${r.ownerPubkeyHex.slice(0, 6)}…${r.ownerPubkeyHex.slice(-6)}`,
        role: "admin",
        addedAt: r.createdAt,
      },
    ],
    limits: [
      { symbol: "USDC", contract: "—", maxPerTransfer: r.maxPerTransfer, spent24h: 0 },
    ],
    allowlistEnforced: r.allowlistEnforced,
    recipients: [],
    createdAt: r.createdAt,
    deployed: true,
    ownerPubkeyHex: r.ownerPubkeyHex,
  };
}

export async function getAllAgents(): Promise<Agent[]> {
  const created = await readCreated();
  return [...created.map(toAgent), ...demoAgents];
}

export async function findAgent(id: string): Promise<Agent | undefined> {
  return (await getAllAgents()).find((a) => a.id === id);
}

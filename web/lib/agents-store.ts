/**
 * Server-only registry of wallets created from the console. Demo agents live in
 * data.ts; anything deployed via the "New agent wallet" action is appended here
 * and merged on top, so the list reflects real testnet deployments.
 */
import "server-only";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { agents as demoAgents, type Agent } from "./data";

const DIR = join(process.cwd(), "data");
const FILE = join(DIR, "registry.json");

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

function read(): CreatedRecord[] {
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as CreatedRecord[];
  } catch {
    return [];
  }
}

export function addCreatedAgent(rec: CreatedRecord) {
  mkdirSync(DIR, { recursive: true });
  const recs = read();
  recs.unshift(rec);
  writeFileSync(FILE, JSON.stringify(recs, null, 2));
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

export function getAllAgents(): Agent[] {
  return [...read().map(toAgent), ...demoAgents];
}

export function findAgent(id: string): Agent | undefined {
  return getAllAgents().find((a) => a.id === id);
}

/**
 * Mock data for the Solvane console. Shaped to mirror the on-chain smart-wallet
 * contract (signers with roles, per-token limits, recipient allowlists) so the
 * UI maps 1:1 onto real contract state when the service is wired in.
 *
 * The first agent uses the real testnet instance deployed from this repo.
 */

export type Role = "admin" | "spender";
export type WalletStatus = "active" | "paused" | "frozen";

export interface Signer {
  label: string;
  pubkey: string; // ed25519, hex-ish display
  role: Role;
  addedAt: string;
}

export interface TokenLimit {
  symbol: string;
  contract: string;
  maxPerTransfer: number;
  spent24h: number;
}

export interface Agent {
  id: string;
  name: string;
  handle: string;
  address: string; // smart-wallet contract address
  status: WalletStatus;
  balanceUsd: number;
  spend24hUsd: number;
  txCount: number;
  signers: Signer[];
  limits: TokenLimit[];
  allowlistEnforced: boolean;
  recipients: { label: string; address: string }[];
  createdAt: string;
  model: string;
  /** True when this wallet is actually deployed on testnet (reads are live). */
  deployed?: boolean;
  /** Raw ed25519 owner pubkey, hex — used to read on-chain signer role. */
  ownerPubkeyHex?: string;
}

export type EventKind =
  | "transfer"
  | "blocked"
  | "policy"
  | "signer"
  | "created";
export type EventStatus = "approved" | "blocked" | "pending";

export interface ActivityEvent {
  id: string;
  kind: EventKind;
  status: EventStatus;
  agentId: string;
  agentName: string;
  summary: string;
  detail?: string;
  amountUsd?: number;
  token?: string;
  to?: string;
  txHash?: string;
  at: string;
}

export interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  scopes: string[];
  lastUsed: string | null;
  createdAt: string;
}

const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

export const agents: Agent[] = [
  {
    id: "vega",
    name: "Vega",
    handle: "research-buyer",
    address: "CBLLJCP2N2TB4LJYEUGTN3NHPF7T5HZITFOBCGYEUDYFZYU4JDDVR4DB",
    status: "active",
    balanceUsd: 4280.55,
    spend24hUsd: 612.4,
    txCount: 1843,
    model: "claude-opus-4-8",
    signers: [
      { label: "Owner key", pubkey: "5bdc70…723a11", role: "admin", addedAt: ago(60 * 24 * 9) },
      { label: "Session · jun", pubkey: "9af201…0c4e7b", role: "spender", addedAt: ago(60 * 30) },
    ],
    limits: [
      { symbol: "USDC", contract: "CCW67…USDC", maxPerTransfer: 250, spent24h: 612.4 },
      { symbol: "XLM", contract: "CAS3…NATIVE", maxPerTransfer: 1000, spent24h: 0 },
    ],
    allowlistEnforced: true,
    recipients: [
      { label: "Perplexity API", address: "GAPI…PLXY" },
      { label: "Modal compute", address: "GMOD…AL77" },
    ],
    createdAt: ago(60 * 24 * 9),
    deployed: true,
    ownerPubkeyHex:
      "5bdc702e29d1e6816112a3ddaf94e47f0a511f23930b8647a8eee5f869723a11",
  },
  {
    id: "rigel",
    name: "Rigel",
    handle: "ops-payouts",
    address: "CBQ2X4M7H9LZP3NWKT5VYAJ6DRESUF8GCXHN2QWE4RTY7UIOPLKJHGFD",
    status: "active",
    balanceUsd: 18920.0,
    spend24hUsd: 3410.0,
    txCount: 920,
    model: "claude-sonnet-4-6",
    signers: [
      { label: "Owner key", pubkey: "1c0e44…ab9d20", role: "admin", addedAt: ago(60 * 24 * 21) },
    ],
    limits: [
      { symbol: "USDC", contract: "CCW67…USDC", maxPerTransfer: 5000, spent24h: 3410 },
    ],
    allowlistEnforced: false,
    recipients: [],
    createdAt: ago(60 * 24 * 21),
  },
  {
    id: "lyra",
    name: "Lyra",
    handle: "data-labeler",
    address: "CDEF9KL2MN4OP6QR8ST0UVWX2YZ4AB6CD8EF0GH2IJ4KL6MN8OP0QRST",
    status: "paused",
    balanceUsd: 740.12,
    spend24hUsd: 0,
    txCount: 311,
    model: "claude-haiku-4-5",
    signers: [
      { label: "Owner key", pubkey: "77ba90…12ce03", role: "admin", addedAt: ago(60 * 24 * 4) },
      { label: "Session · ops", pubkey: "0db551…99af1c", role: "spender", addedAt: ago(60 * 24 * 2) },
    ],
    limits: [{ symbol: "USDC", contract: "CCW67…USDC", maxPerTransfer: 100, spent24h: 0 }],
    allowlistEnforced: true,
    recipients: [{ label: "Scale AI", address: "GSCL…AI42" }],
    createdAt: ago(60 * 24 * 4),
  },
  {
    id: "atlas",
    name: "Atlas",
    handle: "market-maker",
    address: "CGHI3JK5LM7NO9PQ1RS3TU5VW7XY9ZA1BC3DE5FG7HI9JK1LM3NO5PQR",
    status: "frozen",
    balanceUsd: 9610.88,
    spend24hUsd: 0,
    txCount: 5402,
    model: "claude-opus-4-8",
    signers: [
      { label: "Owner key", pubkey: "aa12bc…ef3401", role: "admin", addedAt: ago(60 * 24 * 31) },
    ],
    limits: [{ symbol: "USDC", contract: "CCW67…USDC", maxPerTransfer: 2000, spent24h: 0 }],
    allowlistEnforced: true,
    recipients: [{ label: "DEX router", address: "GDEX…RT19" }],
    createdAt: ago(60 * 24 * 31),
  },
];

export const activity: ActivityEvent[] = [
  {
    id: "e1",
    kind: "transfer",
    status: "approved",
    agentId: "rigel",
    agentName: "Rigel",
    summary: "Paid 240.00 USDC",
    to: "GMOD…AL77",
    token: "USDC",
    amountUsd: 240,
    txHash: "a91f…77c2",
    at: ago(2),
  },
  {
    id: "e2",
    kind: "blocked",
    status: "blocked",
    agentId: "vega",
    agentName: "Vega",
    summary: "Transfer rejected — over per-transfer limit",
    detail: "Attempted 410.00 USDC · cap is 250.00 USDC",
    token: "USDC",
    amountUsd: 410,
    at: ago(6),
  },
  {
    id: "e3",
    kind: "transfer",
    status: "approved",
    agentId: "vega",
    agentName: "Vega",
    summary: "Paid 18.00 USDC",
    to: "GAPI…PLXY",
    token: "USDC",
    amountUsd: 18,
    txHash: "3be0…1a90",
    at: ago(11),
  },
  {
    id: "e4",
    kind: "blocked",
    status: "blocked",
    agentId: "lyra",
    agentName: "Lyra",
    summary: "Transfer rejected — recipient not allowlisted",
    detail: "GUNK…N0WN is not in the allowlist",
    token: "USDC",
    amountUsd: 60,
    at: ago(19),
  },
  {
    id: "e5",
    kind: "policy",
    status: "approved",
    agentId: "rigel",
    agentName: "Rigel",
    summary: "Per-transfer cap raised to 5,000 USDC",
    txHash: "ee20…b3f1",
    at: ago(44),
  },
  {
    id: "e6",
    kind: "signer",
    status: "approved",
    agentId: "vega",
    agentName: "Vega",
    summary: "Spender session key added",
    detail: "9af201…0c4e7b · expires in 24h",
    txHash: "7c4a…0021",
    at: ago(90),
  },
  {
    id: "e7",
    kind: "transfer",
    status: "approved",
    agentId: "rigel",
    agentName: "Rigel",
    summary: "Paid 1,200.00 USDC",
    to: "GPAY…ROLL",
    token: "USDC",
    amountUsd: 1200,
    txHash: "1f8d…cc7e",
    at: ago(140),
  },
  {
    id: "e8",
    kind: "created",
    status: "approved",
    agentId: "lyra",
    agentName: "Lyra",
    summary: "Wallet provisioned",
    detail: "Owner registered as Admin signer",
    txHash: "b220…9a01",
    at: ago(60 * 24 * 4),
  },
];

export const apiKeys: ApiKey[] = [
  {
    id: "k1",
    label: "Production",
    prefix: "sk_live_9F2a",
    scopes: ["wallets:write", "transfers:write", "policy:write"],
    lastUsed: ago(3),
    createdAt: ago(60 * 24 * 30),
  },
  {
    id: "k2",
    label: "CI · read-only",
    prefix: "sk_live_3Kd0",
    scopes: ["wallets:read", "activity:read"],
    lastUsed: ago(60 * 5),
    createdAt: ago(60 * 24 * 12),
  },
  {
    id: "k3",
    label: "Local dev",
    prefix: "sk_test_77Qx",
    scopes: ["wallets:write", "transfers:write"],
    lastUsed: null,
    createdAt: ago(60 * 24 * 2),
  },
];

/** 24-point spend / block series for the overview chart. */
export const spendSeries = Array.from({ length: 24 }, (_, i) => {
  const base = 120 + Math.sin(i / 2.4) * 90 + (i > 16 ? 140 : 0);
  return {
    t: `${String(i).padStart(2, "0")}:00`,
    approved: Math.max(20, Math.round(base + (i % 3) * 28)),
    blocked: i % 5 === 0 ? Math.round(18 + (i % 4) * 9) : i % 7 === 0 ? 22 : 0,
  };
});

export const totals = {
  agents: agents.length,
  activeAgents: agents.filter((a) => a.status === "active").length,
  tvlUsd: agents.reduce((s, a) => s + a.balanceUsd, 0),
  spend24hUsd: agents.reduce((s, a) => s + a.spend24hUsd, 0),
  tx24h: 2841,
  blocked24h: 37,
};

export function getAgent(id: string) {
  return agents.find((a) => a.id === id);
}

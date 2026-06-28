/**
 * Server-only Postgres pool for the Solvane console.
 *
 * Holds the registry of agent wallets created from the console. Connection is
 * lazy and the schema is created on first use (idempotent), so a fresh database
 * needs no manual migration step.
 */
import "server-only";
import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ??
        "postgres://solvane:solvane@localhost:5432/solvane",
      max: 5,
    });
  }
  return pool;
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS agents (
           id                text PRIMARY KEY,
           name              text NOT NULL,
           model             text NOT NULL,
           address           text NOT NULL,
           owner_pubkey_hex  text NOT NULL,
           max_per_transfer  bigint NOT NULL DEFAULT 0,
           allowlist_enforced boolean NOT NULL DEFAULT false,
           created_at        timestamptz NOT NULL DEFAULT now()
         )`,
      )
      .then(() => undefined)
      .catch((e) => {
        // Reset so a later request can retry once the DB is reachable.
        schemaReady = null;
        throw e;
      });
  }
  return schemaReady;
}

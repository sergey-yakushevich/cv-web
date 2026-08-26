import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

/*
 * Schema is inlined rather than read from a .sql file on purpose: the runtime
 * image copies only .next, public and node_modules, so anything under src/ that
 * is not bundled by the compiler does not exist in production.
 *
 * Ids are UUIDv7 — time-ordered, so they index well and sort by creation, while
 * carrying enough randomness that a CV URL cannot be guessed. That matters here
 * because the URL is the only thing protecting a CV; there is no login.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  created_at   TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cvs (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug       TEXT NOT NULL,
  label      TEXT NOT NULL,
  data       TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS cvs_user_id_idx ON cvs (user_id, position);
`;

/**
 * One SQLite connection for the process.
 *
 * Held at module scope because Next reuses the module across requests, and
 * across hot reloads in development — opening a handle per request would leak
 * file descriptors. better-sqlite3 is synchronous, which suits this workload:
 * every query here is a point read or a single-row write.
 */
let db: Database.Database | null = null;

function databasePath(): string {
  // The Docker image points this at a mounted volume. Locally the file sits in
  // .data/ so it survives restarts while staying out of git.
  return process.env.DATABASE_PATH ?? join(process.cwd(), ".data", "cv.db");
}

export function getDb(): Database.Database {
  if (db) return db;

  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true });

  const connection = new Database(path);

  // WAL lets reads proceed while a write is in flight, which matters because a
  // PDF render holds a page open while other requests are being served.
  connection.pragma("journal_mode = WAL");
  connection.pragma("foreign_keys = ON");
  connection.exec(SCHEMA);

  db = connection;

  return db;
}

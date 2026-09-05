import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { seedProducts } from "./seed";
let database: DatabaseSync | undefined;
export function db() {
  if (database) return database;
  const file = process.env.DATABASE_PATH || "./data/commerce.sqlite";
  if (file !== ":memory:")
    mkdirSync(dirname(resolve(/* turbopackIgnore: true */ file)), {
      recursive: true,
    });
  database = new DatabaseSync(file);
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, price INTEGER NOT NULL CHECK(price>0), vat INTEGER NOT NULL CHECK(vat IN(0,1,10,20)), stock INTEGER NOT NULL CHECK(stock>=0), image TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, session_hash TEXT NOT NULL, request_key TEXT NOT NULL, fingerprint TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN('pending','paid','failed')), fulfillment TEXT NOT NULL DEFAULT 'unfulfilled', payment_mode TEXT NOT NULL, address TEXT NOT NULL, items TEXT NOT NULL, subtotal INTEGER NOT NULL, shipping INTEGER NOT NULL, tax INTEGER NOT NULL, total INTEGER NOT NULL, created_at TEXT NOT NULL, tracking TEXT NOT NULL DEFAULT '', payment_token TEXT, UNIQUE(session_hash,request_key));
    CREATE TABLE IF NOT EXISTS payment_events (order_id TEXT PRIMARY KEY REFERENCES orders(id), status TEXT NOT NULL, amount INTEGER NOT NULL, received_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, reset_at INTEGER NOT NULL);
  `);
  const migrated = database
    .prepare("SELECT version FROM schema_version WHERE version=1")
    .get();
  if (!migrated) {
    database.exec("BEGIN IMMEDIATE");
    try {
      const insert = database.prepare(
        "INSERT OR IGNORE INTO products (id,slug,name,description,category,price,vat,stock,image,active) VALUES (?,?,?,?,?,?,?,?,?,?)",
      );
      for (const p of seedProducts)
        insert.run(
          p.id,
          p.slug,
          p.name,
          p.description,
          p.category,
          p.price,
          p.vat,
          p.stock,
          p.image,
          p.active,
        );
      database.prepare("INSERT OR IGNORE INTO schema_version VALUES (1)").run();
      database.exec("COMMIT");
    } catch (e) {
      database.exec("ROLLBACK");
      throw e;
    }
  }
  return database;
}
export function transaction<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    d.exec("COMMIT");
    return result;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

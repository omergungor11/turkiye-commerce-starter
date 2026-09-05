import { cpSync, existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";

if (!existsSync(".next/standalone/server.js")) {
  console.error("Run npm run build first.");
  process.exit(1);
}
mkdirSync(".next/standalone/.next", { recursive: true });
cpSync("public", ".next/standalone/public", { recursive: true });
cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
// Standalone changes cwd. Resolve the database path against the project root.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { resolve } = await import("node:path");
const database = process.env.DATABASE_PATH || "./data/commerce.sqlite";
const child = spawn(process.execPath, [".next/standalone/server.js"], {
  stdio: "inherit",
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME || "127.0.0.1",
    DATABASE_PATH: database === ":memory:" ? database : resolve(database),
  },
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));

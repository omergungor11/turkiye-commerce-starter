import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 60000,
  use: { baseURL: "http://localhost:4181", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev -- --port 4181",
    url: "http://localhost:4181",
    reuseExistingServer: false,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      APP_URL: "http://localhost:4181",
      DATABASE_PATH: join(
        tmpdir(),
        `commerce-e2e-${randomBytes(8).toString("hex")}.sqlite`,
      ),
      PAYMENT_PROVIDER: "demo",
      SESSION_SECRET: "test-only-secret-not-for-deployment-1234567890",
      ADMIN_PASSWORD: "test-only-admin-password",
      COOKIE_SECURE: "false",
    },
  },
});

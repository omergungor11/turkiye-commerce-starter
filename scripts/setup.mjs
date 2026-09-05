import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
if (existsSync(".env.local")) {
  console.log(".env.local already exists; kept unchanged.");
  process.exit(0);
}
const password = randomBytes(18).toString("base64url");
writeFileSync(
  ".env.local",
  `APP_URL=http://localhost:3000\nDATABASE_PATH=./data/commerce.sqlite\nPAYMENT_PROVIDER=demo\nSESSION_SECRET=${randomBytes(32).toString("hex")}\nADMIN_PASSWORD=${password}\nCOOKIE_SECURE=false\n`,
  { mode: 0o600 },
);
console.log(
  "Created .env.local with unique credentials. Read ADMIN_PASSWORD there to sign in at /admin/login.",
);

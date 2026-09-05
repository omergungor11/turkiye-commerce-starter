# Türkiye Commerce Starter

A Turkish e-commerce starter using **Next.js 16, React 19, TypeScript, Node SQLite and PayTR iFrame API**. Includes a fictional homewares storefront, cart, address checkout, stock reservations, order status and a small admin panel. Demo payments require no merchant account.

## Run

```bash
npm ci
npm run setup
npm run dev
```

Use Node 22.13+ (tested on 22.22.3). Open `http://localhost:3000`. Read the generated `ADMIN_PASSWORD` in `.env.local` for `/admin/login`. Never publish this file. Setup preserves an existing environment file.

Choose a product, enter fictional address details, simulate successful/failed payment, then fulfill a paid order from admin. Guest order access is tied to the original browser cookie.

## Payments and scope

The server calculates integer-kuruş totals from its catalog and checks the total accepted by the buyer. Checkout reserves inventory transactionally and uses idempotency keys. Only a verified server callback confirms PayTR payment. Duplicate callbacks cannot duplicate stock changes. Failed payments release stock once. Installments are disabled.

See [PayTR setup](paytr.md). Signature tests use fixtures; real bank/3D Secure behavior must be verified with your merchant sandbox. Pending reservations are retained when provider results are unknown; automated reconciliation is not included.

SQLite requires a persistent disk and one application instance, not a serverless/multi-replica deployment. See [architecture](architecture.md) for Docker instructions. Customer accounts, emails, invoices, refunds, cancellations, carrier APIs, coupons, variants and image uploads are not included. Taxes/shipping are examples. Demo indexing is disabled in root metadata.

## Verify

```bash
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts an isolated server on port 4181. Its fixture password is not used by setup or production.

MIT © [Ömer Güngör](https://github.com/omergungor11). Contributions welcome. Do not include credentials or customer information in issues.

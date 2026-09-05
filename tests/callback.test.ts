import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { POST } from "../src/app/api/paytr/callback/route";
import { createOrder, getOrder, products } from "../src/lib/commerce";
import { callbackHash } from "../src/lib/paytr-crypto";

process.env.DATABASE_PATH = ":memory:";
process.env.PAYMENT_PROVIDER = "paytr";
process.env.PAYTR_MERCHANT_ID = "fixture";
process.env.PAYTR_MERCHANT_KEY = "fixture-key";
process.env.PAYTR_MERCHANT_SALT = "fixture-salt";
process.env.PAYTR_TEST_MODE = "1";
const address = {
  name: "Demo User",
  email: "demo@example.com",
  phone: "05550000000",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Example Street No 1",
  postalCode: "34710",
};
const create = () =>
  createOrder(
    [{ productId: "p1", quantity: 1 }],
    address,
    "fixture",
    randomUUID(),
    "paytr-test",
  ).order;
const notify = (id: string, status: string, amount: string, tamper = false) =>
  POST(
    new Request("http://localhost/api/paytr/callback", {
      method: "POST",
      body: new URLSearchParams({
        merchant_oid: id,
        status,
        total_amount: amount,
        hash: tamper
          ? "invalid"
          : callbackHash(id, status, amount, "fixture-key", "fixture-salt"),
      }),
    }),
  );

test("callback route commits a signed fixture and acknowledges repeated deliveries with exact OK", async () => {
  const o = create();
  for (let i = 0; i < 2; i++) {
    const response = await notify(o.id, "success", String(o.total));
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "OK");
  }
  assert.equal(getOrder(o.id)?.status, "paid");
});
test("callback route rejects tampered signatures and signed incorrect totals", async () => {
  const o = create();
  assert.equal(
    (await notify(o.id, "success", String(o.total), true)).status,
    400,
  );
  assert.equal((await notify(o.id, "success", "1")).status, 500);
  assert.equal(getOrder(o.id)?.status, "pending");
});
test("callback route releases failed reservations only once", async () => {
  const stock = products()[0].stock;
  const o = create();
  assert.equal(products()[0].stock, stock - 1);
  for (let i = 0; i < 2; i++)
    assert.equal(await (await notify(o.id, "failed", "0")).text(), "OK");
  assert.equal(products()[0].stock, stock);
});

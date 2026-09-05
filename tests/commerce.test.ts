import assert from "node:assert/strict";
import test from "node:test";
import { createHmac, randomUUID } from "node:crypto";
import { db } from "../src/lib/database";
import {
  quote,
  createOrder,
  settleOrder,
  products,
  ownOrder,
  shipOrder,
  getOrder,
  normalizeCart,
} from "../src/lib/commerce";
import {
  callbackHash,
  signToken,
  verifyCallback,
} from "../src/lib/paytr-crypto";
import { checkoutSchema } from "../src/lib/validation";
process.env.DATABASE_PATH = ":memory:";
const address = {
  name: "Demo Kullanıcı",
  email: "demo@example.com",
  phone: "05550000000",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Örnek Mahallesi, Test Sokak No: 1",
  postalCode: "34710",
};
const create = (items = [{ productId: "p1", quantity: 1 }]) =>
  createOrder(items, address, "test-session", randomUUID(), "demo").order;
void test("prices come from the catalog; shipping and included VAT use integer kuruş", () => {
  const q = quote([{ productId: "p1", quantity: 1 }]);
  assert.equal(q.subtotal, 34900);
  assert.equal(q.shipping, 7990);
  assert.equal(q.total, 42890);
  assert.equal(
    q.tax,
    Math.round((34900 * 20) / 120) + Math.round((7990 * 20) / 120),
  );
  assert.equal(quote([{ productId: "p1", quantity: 5 }]).shipping, 0);
  assert.equal(
    checkoutSchema.safeParse({
      items: [{ productId: "p1", quantity: 1, price: 1 }],
      address,
      key: randomUUID(),
    }).success,
    false,
  );
});
void test("repeated product rows cannot bypass quantity limits", () => {
  assert.throws(() =>
    normalizeCart([
      { productId: "p1", quantity: 15 },
      { productId: "p1", quantity: 10 },
    ]),
  );
  assert.throws(() => normalizeCart([{ productId: "p1", quantity: 1.2 }]));
});
void test("insufficient stock rolls back every line", () => {
  const before = products();
  assert.throws(() =>
    create([
      { productId: "p1", quantity: 1 },
      { productId: "p4", quantity: 20 },
    ]),
  );
  assert.deepEqual(
    products().map((p) => p.stock),
    before.map((p) => p.stock),
  );
});
void test("checkout retries reuse one order and one reservation", () => {
  const stock = products()[0].stock;
  const key = randomUUID();
  const a = createOrder(
    [{ productId: "p1", quantity: 1 }],
    address,
    "a",
    key,
    "demo",
  );
  const b = createOrder(
    [{ productId: "p1", quantity: 1 }],
    address,
    "a",
    key,
    "demo",
  );
  assert(a.created);
  assert(!b.created);
  assert.equal(a.order.id, b.order.id);
  assert.equal(products()[0].stock, stock - 1);
  assert.throws(() =>
    createOrder([{ productId: "p1", quantity: 2 }], address, "a", key, "demo"),
  );
});
void test("duplicate successful callbacks cannot change stock or create duplicate events", () => {
  const o = create();
  const stock = products()[0].stock;
  settleOrder(o.id, "success", o.total, "demo");
  settleOrder(o.id, "success", o.total, "demo");
  assert.equal(products()[0].stock, stock);
  assert.equal(getOrder(o.id)?.status, "paid");
  assert.equal(
    db()
      .prepare("SELECT count(*) AS n FROM payment_events WHERE order_id=?")
      .get(o.id)?.n,
    1,
  );
  assert.throws(() => settleOrder(o.id, "failed", o.total, "demo"));
});
void test("failed payment releases reserved inventory exactly once", () => {
  const before = products()[0].stock;
  const o = create();
  assert.equal(products()[0].stock, before - 1);
  settleOrder(o.id, "failed", 0, "demo");
  settleOrder(o.id, "failed", 0, "demo");
  assert.equal(products()[0].stock, before);
});
void test("wrong amount or wrong payment mode never marks an order paid", () => {
  const o = create();
  assert.throws(() => settleOrder(o.id, "success", 1, "demo"));
  assert.throws(() => settleOrder(o.id, "success", o.total, "paytr-live"));
  assert.equal(getOrder(o.id)?.status, "pending");
});
void test("another guest cannot read an order and pending orders cannot ship", () => {
  const o = create();
  assert.throws(() => ownOrder(o.id, "wrong-session"));
  assert.throws(() => shipOrder(o.id, "TRACK123"));
  assert.equal(ownOrder(o.id, "test-session").id, o.id);
  settleOrder(o.id, "success", o.total, "demo");
  shipOrder(o.id, "TRACK123");
  assert.equal(getOrder(o.id)?.tracking, "TRACK123");
});
void test("PayTR token follows the provider field order", () => {
  const f = {
    merchant_id: "123",
    user_ip: "203.0.113.1",
    merchant_oid: "TR123",
    email: "demo@example.com",
    payment_amount: "42890",
    user_basket: "basket",
    no_installment: "1",
    max_installment: "0",
    currency: "TL",
    test_mode: "1",
  };
  const expected = createHmac("sha256", "key")
    .update("123203.0.113.1TR123demo@example.com42890basket10TL1salt")
    .digest("base64");
  assert.equal(signToken(f, "key", "salt"), expected);
});
void test("PayTR callback signature rejects tampering and malformed values", () => {
  const f = {
    merchant_oid: "TR123",
    status: "success",
    total_amount: "42890",
    hash: callbackHash("TR123", "success", "42890", "key", "salt"),
  };
  assert(verifyCallback(f, "key", "salt"));
  assert(!verifyCallback({ ...f, total_amount: "1" }, "key", "salt"));
  assert(!verifyCallback({ ...f, hash: "x" }, "key", "salt"));
  assert(!verifyCallback({ ...f, total_amount: "42890oops" }, "key", "salt"));
  assert(!verifyCallback({ ...f, status: "refunded" }, "key", "salt"));
});

void test("a changed checkout total cannot reserve inventory", () => {
  const before = products()[0].stock;
  assert.throws(() =>
    createOrder(
      [{ productId: "p1", quantity: 1 }],
      address,
      "price-check",
      randomUUID(),
      "demo",
      1,
    ),
  );
  assert.equal(products()[0].stock, before);
});

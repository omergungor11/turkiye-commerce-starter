import { createHash, randomBytes } from "node:crypto";
import { db, transaction } from "./database";
import { store } from "../config/store";
import {
  CommerceError,
  type Address,
  type CartLine,
  type Order,
  type OrderItem,
  type Product,
} from "./types";
export function hashSession(session: string) {
  return createHash("sha256").update(session).digest("hex");
}
export function products(all = false): Product[] {
  return db()
    .prepare(
      `SELECT * FROM products ${all ? "" : "WHERE active=1"} ORDER BY rowid`,
    )
    .all()
    .map((row) => ({ ...row })) as unknown as Product[];
}
export function product(slug: string) {
  return db()
    .prepare("SELECT * FROM products WHERE slug=? AND active=1")
    .get(slug) as Product | undefined;
}
export function getOrder(id: string): Order | undefined {
  const row = db()
    .prepare("SELECT * FROM orders WHERE id=?")
    .get(id) as unknown as
    | (Omit<Order, "address" | "items"> & { address: string; items: string })
    | undefined;
  return row
    ? { ...row, address: JSON.parse(row.address), items: JSON.parse(row.items) }
    : undefined;
}
export function ownOrder(id: string, session: string) {
  const order = getOrder(id);
  if (!order || order.session_hash !== hashSession(session))
    throw new CommerceError("Sipariş bulunamadı.", 404);
  return order;
}
export function normalizeCart(lines: CartLine[]) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 30)
    throw new CommerceError("Sepetinizde 1–30 ürün olmalı.");
  const merged = new Map<string, number>();
  for (const l of lines) {
    if (
      typeof l.productId !== "string" ||
      !Number.isSafeInteger(l.quantity) ||
      l.quantity < 1 ||
      l.quantity > 20
    )
      throw new CommerceError("Geçersiz ürün adedi.");
    merged.set(l.productId, (merged.get(l.productId) || 0) + l.quantity);
  }
  const result = [...merged]
    .map(([productId, quantity]) => ({ productId, quantity }))
    .sort((a, b) => a.productId.localeCompare(b.productId));
  if (result.some((l) => l.quantity > 20))
    throw new CommerceError("Bir üründen en fazla 20 adet seçebilirsiniz.");
  return result;
}
export function quote(lines: CartLine[]) {
  const items: OrderItem[] = normalizeCart(lines).map((l) => {
    const p = db()
      .prepare("SELECT * FROM products WHERE id=? AND active=1")
      .get(l.productId) as Product | undefined;
    if (!p || p.stock < l.quantity)
      throw new CommerceError(
        "Ürün stokta yok veya seçilen adet yeterli değil.",
        409,
      );
    return {
      productId: p.id,
      name: p.name,
      quantity: l.quantity,
      unitPrice: p.price,
      vat: p.vat,
    };
  });
  const subtotal = items.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const shipping =
    subtotal >= store.freeShippingThreshold ? 0 : store.shippingCents;
  const tax =
    items.reduce(
      (s, l) =>
        s + Math.round((l.unitPrice * l.quantity * l.vat) / (100 + l.vat)),
      0,
    ) + Math.round((shipping * store.shippingVat) / (100 + store.shippingVat));
  return { items, subtotal, shipping, tax, total: subtotal + shipping };
}
export function createOrder(
  lines: CartLine[],
  address: Address,
  session: string,
  key: string,
  mode: Order["payment_mode"],
  expectedTotal?: number,
) {
  const normalized = normalizeCart(lines);
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ lines: normalized, address, mode, expectedTotal }))
    .digest("hex");
  return transaction(() => {
    const prior = db()
      .prepare(
        "SELECT id,fingerprint FROM orders WHERE session_hash=? AND request_key=?",
      )
      .get(hashSession(session), key) as
      | { id: string; fingerprint: string }
      | undefined;
    if (prior) {
      if (prior.fingerprint !== fingerprint)
        throw new CommerceError(
          "Bu istek anahtarı başka bir sepet için kullanılmış.",
          409,
        );
      return { order: getOrder(prior.id)!, created: false };
    }
    const totals = quote(normalized);
    if (expectedTotal !== undefined && expectedTotal !== totals.total)
      throw new CommerceError(
        "Fiyatlar değişti. Güncel toplamı kontrol ederek tekrar deneyin.",
        409,
      );
    const id = "TR" + randomBytes(12).toString("hex").toUpperCase();
    for (const l of normalized) {
      const r = db()
        .prepare("UPDATE products SET stock=stock-? WHERE id=? AND stock>=?")
        .run(l.quantity, l.productId, l.quantity);
      if (Number(r.changes) !== 1)
        throw new CommerceError(
          "Stok güncellendi. Sepetinizi kontrol edin.",
          409,
        );
    }
    db()
      .prepare(
        "INSERT INTO orders (id,session_hash,request_key,fingerprint,status,payment_mode,address,items,subtotal,shipping,tax,total,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        id,
        hashSession(session),
        key,
        fingerprint,
        "pending",
        mode,
        JSON.stringify(address),
        JSON.stringify(totals.items),
        totals.subtotal,
        totals.shipping,
        totals.tax,
        totals.total,
        new Date().toISOString(),
      );
    return { order: getOrder(id)!, created: true };
  });
}
export function settleOrder(
  id: string,
  status: "success" | "failed",
  amount: number,
  mode: Order["payment_mode"],
) {
  return transaction(() => {
    const o = getOrder(id);
    if (!o) throw new CommerceError("Unknown order", 404);
    if (o.payment_mode !== mode)
      throw new CommerceError("Payment mode mismatch", 409);
    // Installments are disabled in the token request, so the signed amount must match exactly.
    if (
      !Number.isSafeInteger(amount) ||
      amount < 0 ||
      (status === "success" && amount !== o.total)
    )
      throw new CommerceError("Payment amount mismatch", 400);
    const prior = db()
      .prepare("SELECT status,amount FROM payment_events WHERE order_id=?")
      .get(id) as { status: string; amount: number } | undefined;
    if (prior) {
      if (prior.status !== status || prior.amount !== amount)
        throw new CommerceError("Conflicting payment notification", 409);
      return o;
    }
    if (o.status !== "pending")
      throw new CommerceError("Order already finalized", 409);
    db()
      .prepare("INSERT INTO payment_events VALUES (?,?,?,?)")
      .run(id, status, amount, new Date().toISOString());
    db()
      .prepare("UPDATE orders SET status=?,payment_token=NULL WHERE id=?")
      .run(status === "success" ? "paid" : "failed", id);
    if (status === "failed")
      for (const l of o.items)
        db()
          .prepare("UPDATE products SET stock=stock+? WHERE id=?")
          .run(l.quantity, l.productId);
    return getOrder(id)!;
  });
}
export function savePaymentToken(id: string, token: string) {
  db()
    .prepare(
      "UPDATE orders SET payment_token=? WHERE id=? AND status='pending'",
    )
    .run(token, id);
}
export function listOrders() {
  const ids = db()
    .prepare("SELECT id FROM orders ORDER BY created_at DESC LIMIT 100")
    .all() as { id: string }[];
  return ids.map((r) => getOrder(r.id)!);
}
export function updateProduct(
  id: string,
  data: { name: string; price: number; stock: number; active: boolean },
) {
  const r = db()
    .prepare("UPDATE products SET name=?,price=?,stock=?,active=? WHERE id=?")
    .run(data.name, data.price, data.stock, data.active ? 1 : 0, id);
  if (!r.changes) throw new CommerceError("Ürün bulunamadı.", 404);
}
export function shipOrder(id: string, tracking: string) {
  const r = db()
    .prepare(
      "UPDATE orders SET fulfillment='shipped',tracking=? WHERE id=? AND status='paid' AND fulfillment='unfulfilled'",
    )
    .run(tracking, id);
  if (!r.changes)
    throw new CommerceError(
      "Yalnızca ödenmiş ve gönderilmemiş siparişler kargolanabilir.",
      409,
    );
}
export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  return transaction(() => {
    const now = Date.now();
    db().prepare("DELETE FROM rate_limits WHERE reset_at<?").run(now);
    const r = db()
      .prepare("SELECT hits FROM rate_limits WHERE key=?")
      .get(key) as { hits: number } | undefined;
    if (r && r.hits >= limit)
      throw new CommerceError(
        "Çok fazla istek. Lütfen daha sonra tekrar deneyin.",
        429,
      );
    db()
      .prepare(
        "INSERT INTO rate_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1",
      )
      .run(key, now + windowMs);
  });
}

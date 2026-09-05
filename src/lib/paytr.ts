import "server-only";
import { isIP } from "node:net";
import { signToken } from "./paytr-crypto";
import type { Order } from "./types";
import { CommerceError } from "./types";
export function paymentMode(): Order["payment_mode"] {
  const provider = process.env.PAYMENT_PROVIDER || "demo";
  if (provider === "demo") return "demo";
  if (provider !== "paytr")
    throw new CommerceError("Ödeme sağlayıcısı yapılandırılmamış.", 503);
  if (!["0", "1"].includes(process.env.PAYTR_TEST_MODE || ""))
    throw new CommerceError("PayTR test modu açıkça belirtilmeli.", 503);
  if (
    !process.env.PAYTR_MERCHANT_ID ||
    !process.env.PAYTR_MERCHANT_KEY ||
    !process.env.PAYTR_MERCHANT_SALT
  )
    throw new CommerceError("PayTR anahtarları henüz yapılandırılmamış.", 503);
  return process.env.PAYTR_TEST_MODE === "1" ? "paytr-test" : "paytr-live";
}
export function origin() {
  const url = process.env.APP_URL || "http://localhost:3000";
  const u = new URL(url);
  if (u.pathname !== "/" || u.search || u.hash)
    throw new Error("APP_URL must be an origin");
  return u.origin;
}
export function customerIp(request: Request) {
  const test = process.env.PAYTR_TEST_USER_IP;
  const ip =
    paymentMode() === "paytr-test" && test
      ? test
      : process.env.TRUST_PROXY === "true"
        ? request.headers.get("x-forwarded-for")?.split(",")[0].trim()
        : undefined;
  if (!ip || !isIP(ip))
    throw new CommerceError(
      "Ödeme için güvenilir istemci IP ayarı eksik.",
      503,
    );
  return ip;
}
export async function createPaytrSession(order: Order, ip: string) {
  const mode = paymentMode();
  if (mode === "demo" || mode !== order.payment_mode)
    throw new CommerceError("Ödeme modu uyuşmuyor.", 409);
  const base = origin();
  if (!base.startsWith("https://"))
    throw new CommerceError("PayTR için HTTPS adresi gerekli.", 503);
  const basket = order.items.map((i) => [
    i.name,
    (i.unitPrice / 100).toFixed(2),
    i.quantity,
  ]);
  if (order.shipping)
    basket.push(["Kargo", (order.shipping / 100).toFixed(2), 1]);
  const fields = {
    merchant_id: process.env.PAYTR_MERCHANT_ID!,
    user_ip: ip,
    merchant_oid: order.id,
    email: order.address.email,
    payment_amount: String(order.total),
    user_basket: Buffer.from(JSON.stringify(basket)).toString("base64"),
    no_installment: "1",
    max_installment: "0",
    currency: "TL",
    test_mode: mode === "paytr-test" ? "1" : "0",
  };
  const body = new URLSearchParams({
    ...fields,
    paytr_token: signToken(
      fields,
      process.env.PAYTR_MERCHANT_KEY!,
      process.env.PAYTR_MERCHANT_SALT!,
    ),
    user_name: order.address.name,
    user_phone: order.address.phone,
    user_address: `${order.address.address}, ${order.address.district}, ${order.address.city} ${order.address.postalCode}`,
    merchant_ok_url: `${base}/siparis/${order.id}`,
    merchant_fail_url: `${base}/siparis/${order.id}`,
    timeout_limit: "30",
    debug_on: "0",
    lang: "tr",
  });
  try {
    const res = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error("upstream");
    const data = await res.json();
    if (
      data.status !== "success" ||
      typeof data.token !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(data.token)
    )
      throw new Error("token rejected");
    return data.token as string;
  } catch {
    throw new CommerceError(
      "Ödeme ekranı açılamadı. Siparişiniz beklemede; yeniden sipariş vermeden mağazayla iletişime geçin.",
      502,
    );
  }
}

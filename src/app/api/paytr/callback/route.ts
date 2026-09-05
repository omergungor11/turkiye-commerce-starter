import { getOrder, settleOrder } from "@/lib/commerce";
import { verifyCallback } from "@/lib/paytr-crypto";
import { paymentMode } from "@/lib/paytr";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const mode = paymentMode();
    if (mode === "demo")
      return new Response("Payment provider disabled", { status: 503 });
    const text = await request.text();
    if (text.length > 20000)
      return new Response("Request too large", { status: 413 });
    const form = new URLSearchParams(text);
    const fields: Record<string, string> = {};
    for (const [key, value] of form) {
      if (key in fields)
        return new Response("Duplicate field", { status: 400 });
      fields[key] = value;
    }
    if (
      !verifyCallback(
        fields,
        process.env.PAYTR_MERCHANT_KEY!,
        process.env.PAYTR_MERCHANT_SALT!,
      )
    )
      return new Response("Invalid hash", { status: 400 });
    const order = getOrder(fields.merchant_oid);
    if (!order) return new Response("Unknown order", { status: 404 });
    // Record mode is authoritative. Callback test_mode is not included in PayTR's signature.
    if (
      order.payment_mode === "demo" ||
      order.payment_mode !== mode ||
      (mode === "paytr-live" && fields.test_mode === "1")
    )
      return new Response("Payment mode mismatch", { status: 409 });
    settleOrder(
      order.id,
      fields.status as "success" | "failed",
      Number(fields.total_amount),
      order.payment_mode,
    );
    return new Response("OK", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new Response("Notification not committed; retry required", {
      status: 500,
    });
  }
}

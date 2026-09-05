import { NextResponse } from "next/server";
import { guestSession } from "@/lib/auth";
import {
  consumeRateLimit,
  createOrder,
  savePaymentToken,
} from "@/lib/commerce";
import { assertOrigin, jsonBody, failure } from "@/lib/http";
import { checkoutSchema, parse } from "@/lib/validation";
import { createPaytrSession, customerIp, paymentMode } from "@/lib/paytr";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const session = await guestSession();
    const input = parse(checkoutSchema, await jsonBody(request));
    const mode = paymentMode();
    const ip = mode === "demo" ? "" : customerIp(request);
    consumeRateLimit("checkout-global", 60, 60000);
    consumeRateLimit("checkout-" + session, 10, 60000);
    const { order, created } = createOrder(
      input.items,
      input.address,
      session,
      input.key,
      mode,
      input.expectedTotal,
    );
    if (mode !== "demo" && created) {
      try {
        const token = await createPaytrSession(order, ip);
        savePaymentToken(order.id, token);
      } catch {
        return NextResponse.json({
          url: `/siparis/${order.id}`,
          warning: "Ödeme ekranı açılamadı. Sipariş kaydınızı kontrol edin.",
        });
      }
    }
    return NextResponse.json({
      url:
        mode === "demo" && order.status === "pending"
          ? `/odeme/${order.id}`
          : `/siparis/${order.id}`,
    });
  } catch (e) {
    return failure(e);
  }
}

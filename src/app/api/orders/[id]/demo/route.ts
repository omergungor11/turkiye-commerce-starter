import { NextResponse } from "next/server";
import { guestSession } from "@/lib/auth";
import { ownOrder, settleOrder } from "@/lib/commerce";
import { assertOrigin, jsonBody, failure } from "@/lib/http";
import { paymentMode } from "@/lib/paytr";
import { CommerceError } from "@/lib/types";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertOrigin(request);
    if (paymentMode() !== "demo")
      throw new CommerceError("Demo ödemesi kapalı.", 404);
    const o = ownOrder((await params).id, await guestSession());
    const body = await jsonBody(request);
    if (!["success", "failed"].includes(body.status))
      throw new CommerceError("Geçersiz sonuç.");
    settleOrder(o.id, body.status, o.total, "demo");
    return NextResponse.json({ url: `/siparis/${o.id}` });
  } catch (e) {
    return failure(e);
  }
}

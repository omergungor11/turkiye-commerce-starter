import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { shipOrder } from "@/lib/commerce";
import { assertOrigin, jsonBody, failure } from "@/lib/http";
import { parse } from "@/lib/validation";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    await requireAdmin();
    const data = parse(
      z
        .object({
          id: z.string().max(64),
          tracking: z.string().trim().min(3).max(100),
        })
        .strict(),
      await jsonBody(request),
    );
    shipOrder(data.id, data.tracking);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

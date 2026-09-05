import { NextResponse } from "next/server";
import { logoutAdmin } from "@/lib/auth";
import { assertOrigin, failure } from "@/lib/http";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    await logoutAdmin();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

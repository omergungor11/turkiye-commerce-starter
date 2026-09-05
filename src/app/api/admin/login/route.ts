import { NextResponse } from "next/server";
import { loginAdmin, verifyPassword } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/commerce";
import { assertOrigin, jsonBody, failure } from "@/lib/http";
import { CommerceError } from "@/lib/types";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    consumeRateLimit("admin-login-global", 10, 15 * 60000);
    const body = await jsonBody(request);
    if (
      typeof body.password !== "string" ||
      body.password.length > 256 ||
      !verifyPassword(body.password)
    )
      throw new CommerceError("Giriş bilgileri geçersiz.", 401);
    await loginAdmin();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

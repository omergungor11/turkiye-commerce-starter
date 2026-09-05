import { NextResponse } from "next/server";
import { CommerceError } from "./types";
export function assertOrigin(request: Request) {
  const allowed = new URL(process.env.APP_URL || "http://localhost:3000")
    .origin;
  if (request.headers.get("origin") !== allowed)
    throw new CommerceError("Geçersiz istek kaynağı.", 403);
}
export async function jsonBody(request: Request) {
  const text = await request.text();
  if (text.length > 20000) throw new CommerceError("İstek çok büyük.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new CommerceError("Geçersiz JSON.");
  }
}
export function failure(error: unknown) {
  if (error instanceof CommerceError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  return NextResponse.json(
    { error: "İşlem tamamlanamadı. Lütfen tekrar deneyin." },
    { status: 500 },
  );
}

import { NextResponse } from "next/server";
import { quote } from "@/lib/commerce";
import { assertOrigin, jsonBody, failure } from "@/lib/http";
import { cartSchema, parse } from "@/lib/validation";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    return NextResponse.json(quote(parse(cartSchema, await jsonBody(request))));
  } catch (e) {
    return failure(e);
  }
}

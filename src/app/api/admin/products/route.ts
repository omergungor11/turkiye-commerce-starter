import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { updateProduct } from "@/lib/commerce";
import { db } from "@/lib/database";
import { assertOrigin, jsonBody, failure } from "@/lib/http";
import { parse } from "@/lib/validation";
const base = z.object({
  name: z.string().trim().min(2).max(100),
  price: z.number().int().min(1).max(100000000),
  stock: z.number().int().min(0).max(1000000),
  active: z.boolean(),
});
export async function PATCH(request: Request) {
  try {
    assertOrigin(request);
    await requireAdmin();
    const data = parse(
      base.extend({ id: z.string().min(1).max(50) }).strict(),
      await jsonBody(request),
    );
    updateProduct(data.id, data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    await requireAdmin();
    const p = parse(
      base
        .extend({
          slug: z
            .string()
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            .max(100),
          description: z.string().trim().min(10).max(1000),
          category: z.enum(["Seramik", "Tekstil", "Mutfak", "Setler"]),
          vat: z.union([
            z.literal(0),
            z.literal(1),
            z.literal(10),
            z.literal(20),
          ]),
          image: z.enum([
            "/images/cup.png",
            "/images/linen.png",
            "/images/board.png",
            "/images/collection.png",
          ]),
        })
        .strict(),
      await jsonBody(request),
    );
    if (db().prepare("SELECT id FROM products WHERE slug=?").get(p.slug))
      return NextResponse.json(
        { error: "Bu ürün adresi zaten kullanılıyor." },
        { status: 409 },
      );
    db()
      .prepare("INSERT INTO products VALUES(?,?,?,?,?,?,?,?,?,?)")
      .run(
        randomBytes(8).toString("hex"),
        p.slug,
        p.name,
        p.description,
        p.category,
        p.price,
        p.vat,
        p.stock,
        p.image,
        p.active ? 1 : 0,
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

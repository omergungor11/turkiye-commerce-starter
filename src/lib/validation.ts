import { z } from "zod";
import { CommerceError } from "./types";
export const cartSchema = z
  .array(
    z
      .object({
        productId: z.string().min(1).max(50),
        quantity: z.number().int().min(1).max(20),
      })
      .strict(),
  )
  .min(1)
  .max(30);
export const addressSchema = z
  .object({
    name: z.string().trim().min(3).max(60),
    email: z
      .email()
      .max(100)
      .regex(/^[\x20-\x7E]+$/),
    phone: z.string().regex(/^(\+90|0)?5\d{9}$/),
    city: z.string().trim().min(2).max(50),
    district: z.string().trim().min(2).max(50),
    address: z.string().trim().min(10).max(250),
    postalCode: z.string().regex(/^\d{5}$/),
  })
  .strict();
export const checkoutSchema = z
  .object({
    items: cartSchema,
    address: addressSchema,
    key: z.string().uuid(),
    expectedTotal: z.number().int().positive(),
  })
  .strict();
export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success)
    throw new CommerceError(
      "Bilgileri kontrol edin: " +
        result.error.issues
          .map((i) => i.path.join("."))
          .slice(0, 3)
          .join(", "),
    );
  return result.data;
}

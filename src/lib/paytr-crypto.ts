import { createHmac, timingSafeEqual } from "node:crypto";
export function signToken(
  fields: {
    merchant_id: string;
    user_ip: string;
    merchant_oid: string;
    email: string;
    payment_amount: string;
    user_basket: string;
    no_installment: string;
    max_installment: string;
    currency: string;
    test_mode: string;
  },
  key: string,
  salt: string,
) {
  const f = fields;
  return createHmac("sha256", key)
    .update(
      f.merchant_id +
        f.user_ip +
        f.merchant_oid +
        f.email +
        f.payment_amount +
        f.user_basket +
        f.no_installment +
        f.max_installment +
        f.currency +
        f.test_mode +
        salt,
    )
    .digest("base64");
}
export function callbackHash(
  oid: string,
  status: string,
  amount: string,
  key: string,
  salt: string,
) {
  return createHmac("sha256", key)
    .update(oid + salt + status + amount)
    .digest("base64");
}
export function verifyCallback(
  fields: Record<string, string>,
  key: string,
  salt: string,
) {
  if (
    !/^[A-Za-z0-9]{1,64}$/.test(fields.merchant_oid || "") ||
    !["success", "failed"].includes(fields.status) ||
    !/^\d{1,12}$/.test(fields.total_amount || "")
  )
    return false;
  const expected = Buffer.from(
    callbackHash(
      fields.merchant_oid,
      fields.status,
      fields.total_amount,
      key,
      salt,
    ),
  );
  const actual = Buffer.from(fields.hash || "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

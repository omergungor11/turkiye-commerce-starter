import "server-only";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { CommerceError } from "./types";
const adminCookie = "commerce_admin";
export const guestCookie = "commerce_guest";
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32)
    throw new CommerceError(
      "Önce npm run setup ile oturum anahtarını oluşturun.",
      503,
    );
  return s;
}
function sign(s: string) {
  return createHmac("sha256", secret()).update(s).digest("hex");
}
export function verifyPassword(password: string) {
  const stored = process.env.ADMIN_PASSWORD;
  if (!stored || stored.length < 16)
    throw new CommerceError("Yönetici parolası yapılandırılmamış.", 503);
  return timingSafeEqual(
    scryptSync(password, "commerce-admin-v1", 32),
    scryptSync(stored, "commerce-admin-v1", 32),
  );
}
export async function adminSession() {
  const value = (await cookies()).get(adminCookie)?.value;
  if (!value) return false;
  const [exp, signature] = value.split(".");
  if (!/^\d+$/.test(exp) || !signature || !/^[a-f0-9]{64}$/.test(signature))
    return false;
  const expected = sign(exp);
  return (
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) &&
    Number(exp) > Date.now()
  );
}
export async function requireAdmin() {
  if (!(await adminSession()))
    throw new CommerceError("Yönetici girişi gerekli.", 401);
}
const secure = () =>
  process.env.COOKIE_SECURE === "true" ||
  (process.env.APP_URL || "").startsWith("https://");
export async function loginAdmin() {
  const exp = String(Date.now() + 8 * 60 * 60 * 1000);
  (await cookies()).set(adminCookie, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: secure(),
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
}
export async function logoutAdmin() {
  (await cookies()).delete(adminCookie);
}
export async function guestSession(create = false) {
  const jar = await cookies();
  let s = jar.get(guestCookie)?.value;
  if (!s || !/^[a-f0-9]{64}$/.test(s)) {
    if (!create)
      throw new CommerceError("Oturum bulunamadı. Sayfayı yenileyin.", 401);
    s = randomBytes(32).toString("hex");
    jar.set(guestCookie, s, {
      httpOnly: true,
      secure: secure(),
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 86400,
    });
  }
  return s;
}

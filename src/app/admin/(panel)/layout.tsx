import { redirect } from "next/navigation";
import { adminSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await adminSession())) redirect("/admin/login");
  return children;
}

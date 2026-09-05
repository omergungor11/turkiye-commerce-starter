import { redirect } from "next/navigation";
import { guestSession } from "@/lib/auth";
import { ownOrder } from "@/lib/commerce";
import { DemoPayment } from "@/components/payment";
import { money } from "@/config/store";
export const dynamic = "force-dynamic";
export const metadata = { title: "Demo ödeme" };
export default async function Payment({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let o;
  try {
    o = ownOrder((await params).id, await guestSession());
  } catch {
    redirect("/sepet");
  }
  if (o.payment_mode !== "demo" || o.status !== "pending")
    redirect(`/siparis/${o.id}`);
  return (
    <div className="wrap page narrow">
      <p className="eyebrow">ÖDEME SİMÜLASYONU</p>
      <h1 className="page-title">Son adım.</h1>
      <div className="panel">
        <p className="muted">{o.id}</p>
        <h2>{money(o.total)}</h2>
        <DemoPayment id={o.id} />
      </div>
    </div>
  );
}

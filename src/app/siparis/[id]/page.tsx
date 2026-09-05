import Link from "next/link";
import { notFound } from "next/navigation";
import { guestSession } from "@/lib/auth";
import { ownOrder } from "@/lib/commerce";
import { RefreshOrder } from "@/components/payment";
import { money } from "@/config/store";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sipariş durumu", referrer: "no-referrer" };
export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let o;
  try {
    o = ownOrder((await params).id, await guestSession());
  } catch {
    notFound();
  }
  return (
    <div className="wrap page narrow">
      <p className="eyebrow">
        {o.payment_mode === "paytr-live"
          ? "SİPARİŞİNİZ"
          : "TEST SİPARİŞİ · GERÇEK TAHSİLAT YOK"}
      </p>
      <h1 className="page-title">
        {o.status === "paid"
          ? "Siparişiniz alındı."
          : o.status === "failed"
            ? "Ödeme tamamlanamadı."
            : "Ödeme bekleniyor."}
      </h1>
      <p className="muted order-id">{o.id}</p>
      <div className="panel">
        {o.status === "pending" && (
          <p>
            Bu sayfanın açılması ödeme onayı değildir. Sonuç doğrulandığında
            durum güncellenir.
          </p>
        )}
        {o.status === "pending" && o.payment_token && (
          <iframe
            src={`https://www.paytr.com/odeme/guvenli/${o.payment_token}`}
            title="PayTR güvenli ödeme"
            className="paytr-frame"
            referrerPolicy="no-referrer"
          />
        )}
        {o.status === "pending" &&
          !o.payment_token &&
          o.payment_mode !== "demo" && (
            <p className="error">
              Ödeme ekranı hazır değil. Yeniden sipariş oluşturmadan mağazayla
              iletişime geçin.
            </p>
          )}
        {o.items.map((l) => (
          <div className="order-line" key={l.productId}>
            <span>
              {l.name} × {l.quantity}
            </span>
            <strong>{money(l.unitPrice * l.quantity)}</strong>
          </div>
        ))}
        <div className="order-line">
          <span>Kargo</span>
          <span>{money(o.shipping)}</span>
        </div>
        <div className="order-line">
          <strong>Toplam</strong>
          <strong>{money(o.total)}</strong>
        </div>
        <h3>Teslimat</h3>
        <p>
          {o.address.name}
          <br />
          {o.address.address}
          <br />
          {o.address.district} / {o.address.city}
        </p>
        <p>
          <strong>
            {o.fulfillment === "shipped"
              ? "Kargoya verildi"
              : "Henüz kargoya verilmedi"}
          </strong>
          {o.tracking && <> · Takip no: {o.tracking}</>}
        </p>
        <RefreshOrder pending={o.status === "pending"} />
      </div>
      <Link className="back-link" href="/">
        ← Mağazaya dön
      </Link>
    </div>
  );
}

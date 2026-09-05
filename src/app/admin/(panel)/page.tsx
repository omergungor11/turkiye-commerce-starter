import { products, listOrders } from "@/lib/commerce";
import { adminSession } from "@/lib/auth";
import {
  AdminLogout,
  ProductEditor,
  NewProduct,
  ShipOrder,
} from "@/components/admin";
import { money } from "@/config/store";
import { redirect } from "next/navigation";
export const metadata = { title: "Yönetim paneli" };
export default async function Admin() {
  if (!(await adminSession())) redirect("/admin/login");
  const all = products(true),
    orders = listOrders();
  const paid = orders.filter((o) => o.status === "paid");
  const revenue = paid
    .filter((o) => o.payment_mode === "paytr-live")
    .reduce((s, o) => s + o.total, 0);
  return (
    <div className="wrap page admin">
      <div className="section-title">
        <div>
          <p className="eyebrow">DOKU / MAĞAZA YÖNETİMİ</p>
          <h1 className="page-title">Genel bakış.</h1>
        </div>
        <AdminLogout />
      </div>
      <div className="metrics">
        <div>
          <span>Ürün</span>
          <strong>{all.length}</strong>
        </div>
        <div>
          <span>Son 100 sipariş</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Ödenmiş (test dahil)</span>
          <strong>{paid.length}</strong>
        </div>
        <div>
          <span>Canlı tahsilat · son 100 sipariş</span>
          <strong>{money(revenue)}</strong>
        </div>
      </div>
      <section>
        <div className="section-title">
          <h2>Ürünler ve stok</h2>
          <span>{all.length} ürün</span>
        </div>
        <p className="muted">
          Satılabilir stok, bekleyen siparişlere ayrılmış adetleri içermez. Bu
          alanı fiziksel toplam stok olarak kullanmayın.
        </p>
        {all.map((p) => (
          <ProductEditor
            key={`${p.id}-${p.price}-${p.stock}-${p.active}-${p.name}`}
            product={p}
          />
        ))}
        <NewProduct />
      </section>
      <section className="admin-orders">
        <h2>Son siparişler</h2>
        {orders.length === 0 ? (
          <div className="panel">
            <p>
              Henüz sipariş yok. Mağazadan demo alışveriş yaparak akışı deneyin.
            </p>
          </div>
        ) : (
          orders.map((o) => (
            <article className="panel" key={o.id}>
              <div className="section-title">
                <h3 className="order-id">{o.id}</h3>
                <span className={`status ${o.status}`}>
                  {o.status === "paid"
                    ? "Ödendi"
                    : o.status === "failed"
                      ? "Başarısız"
                      : "Ödeme bekliyor"}{" "}
                  · {o.payment_mode}
                </span>
              </div>
              <p>
                {o.address.name} · {o.address.email} · {o.address.phone}
              </p>
              <p>
                {o.address.address}, {o.address.district} / {o.address.city}{" "}
                {o.address.postalCode}
              </p>
              <p>
                {new Date(o.created_at).toLocaleString("tr-TR", {
                  timeZone: "Europe/Istanbul",
                })}
              </p>
              {o.items.map((l) => (
                <div className="order-line" key={l.productId}>
                  <span>
                    {l.name} × {l.quantity}
                  </span>
                  <span>{money(l.unitPrice * l.quantity)}</span>
                </div>
              ))}
              <p>
                <strong>Toplam: {money(o.total)}</strong> · Kargo:{" "}
                {money(o.shipping)} · Dahil KDV: {money(o.tax)}
              </p>
              {o.status === "paid" && o.fulfillment === "unfulfilled" ? (
                <ShipOrder id={o.id} />
              ) : (
                <p>
                  {o.fulfillment === "shipped"
                    ? `Kargoya verildi · ${o.tracking}`
                    : "Kargo işlemi için ödeme onayı bekleniyor."}
                </p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

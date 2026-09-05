import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { product } from "@/lib/commerce";
import { money } from "@/config/store";
import { AddToCart } from "@/components/cart";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = product((await params).slug);
  return { title: p?.name || "Ürün bulunamadı" };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = product((await params).slug);
  if (!p) notFound();
  return (
    <div className="wrap page">
      <Link href="/#koleksiyon" className="back-link">
        ← Koleksiyona dön
      </Link>
      <div className="product-detail">
        <Image
          src={p.image}
          alt={p.name}
          width={1000}
          height={1000}
          priority
          sizes="(max-width: 750px) 100vw, 50vw"
        />
        <div className="detail-copy">
          <p className="eyebrow">{p.category.toLocaleUpperCase("tr")}</p>
          <h1>{p.name}</h1>
          <p className="detail-price">
            {money(p.price)} <small>KDV dahil</small>
          </p>
          <p>{p.description}</p>
          <p className="stock">
            {p.stock > 0 ? `${p.stock} adet stokta` : "Şu anda stokta yok"}
          </p>
          <AddToCart id={p.id} stock={p.stock} large />
          <dl className="detail-list">
            <div>
              <dt>Kargo</dt>
              <dd>79,90 TL · 1.500 TL üzeri ücretsiz</dd>
            </div>
            <div>
              <dt>Vergi</dt>
              <dd>Fiyata %{p.vat} KDV dahildir</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

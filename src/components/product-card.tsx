import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { money } from "@/config/store";
import { AddToCart } from "./cart";
export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="product-card">
      <Link href={`/urun/${p.slug}`} className="product-image">
        <Image
          src={p.image}
          alt={p.name}
          width={700}
          height={700}
          sizes="(max-width: 650px) 90vw, (max-width: 1000px) 45vw, 25vw"
        />
        <span className="product-tag">{p.category}</span>
        {p.stock === 0 && <span className="sold-out">Tükendi</span>}
      </Link>
      <div className="product-info">
        <div>
          <Link href={`/urun/${p.slug}`}>
            <h3>{p.name}</h3>
          </Link>
          <p>{money(p.price)}</p>
        </div>
        <AddToCart id={p.id} stock={p.stock} />
      </div>
    </article>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { products } from "@/lib/commerce";
import { ProductCard } from "@/components/product-card";
import { store } from "@/config/store";
export const dynamic = "force-dynamic";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string; sirala?: string }>;
}) {
  const s = await searchParams;
  const q = typeof s.q === "string" ? s.q : "";
  const category = typeof s.kategori === "string" ? s.kategori : "Tümü";
  let items = products().filter(
    (p) =>
      (category === "Tümü" || !category || p.category === category) &&
      p.name.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr")),
  );
  if (s.sirala === "artan") items = items.sort((a, b) => a.price - b.price);
  if (s.sirala === "azalan") items = items.sort((a, b) => b.price - a.price);
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">EVİNİZİN KÜÇÜK RİTÜELLERİ</p>
          <h1>
            Her güne
            <br />
            <em>biraz doku.</em>
          </h1>
          <p className="hero-intro">
            Sabahın ilk kahvesinden akşamın sakinliğine.
            <br />
            Hayatınıza eşlik eden yalın parçalar.
          </p>
          <Link href="#koleksiyon" className="button">
            Koleksiyonu keşfet <ArrowUpRight size={20} />
          </Link>
          <p className="hero-index">
            01 — GÜNDELİK KOLEKSİYON <ArrowDown size={15} />
          </p>
        </div>
        <div className="hero-visual">
          <Image
            src="/images/collection.png"
            alt="Taş masa üzerinde seramik kupa, keten bez ve ahşap sunum parçaları"
            width={1536}
            height={1024}
            loading="eager"
            sizes="(max-width: 750px) 100vw, 60vw"
          />
          <div className="image-caption">
            Sade. İşlevsel. Zamansız.<span>DOĞAL DOKULAR ↗</span>
          </div>
        </div>
      </section>
      <section className="catalog wrap" id="koleksiyon">
        <div className="section-title">
          <div>
            <p className="eyebrow">AZ, ÖZ VE SİZDEN BİR PARÇA</p>
            <h2>Gündelik favoriler.</h2>
          </div>
          <span>{items.length} ürün</span>
        </div>
        <form className="catalog-filters" action="/#koleksiyon">
          <div className="field">
            <label htmlFor="kategori" className="sr-only">
              Kategori
            </label>
            <select name="kategori" id="kategori" defaultValue={category}>
              {store.categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field search">
            <label htmlFor="q" className="sr-only">
              Ürün ara
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Koleksiyonda ara…"
            />
          </div>
          <div className="field">
            <label htmlFor="sirala" className="sr-only">
              Sıralama
            </label>
            <select id="sirala" name="sirala" defaultValue={s.sirala || ""}>
              <option value="">Önerilen sıralama</option>
              <option value="artan">Fiyat: düşükten yükseğe</option>
              <option value="azalan">Fiyat: yüksekten düşüğe</option>
            </select>
          </div>
          <button className="small-button">Filtrele</button>
        </form>
        {items.length ? (
          <div className="product-grid">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>Bu aramada ürün bulunamadı.</h3>
            <Link href="/#koleksiyon">Tüm koleksiyonu göster →</Link>
          </div>
        )}
      </section>
      <section className="story wrap">
        <p className="eyebrow">DAHA AZ, DAHA ANLAMLI</p>
        <h2>
          Bir eşya değil,
          <br />
          <em>gününüzün bir parçası.</em>
        </h2>
        <p>
          Dokunmak, kullanmak, birlikte yaşamak için.
          <br />
          Doku’nun örnek koleksiyonuyla tanışın.
        </p>
      </section>
    </>
  );
}

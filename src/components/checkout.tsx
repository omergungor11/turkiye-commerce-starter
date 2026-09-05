"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ArrowRight } from "lucide-react";
import { useCart } from "./cart";
import { money } from "@/config/store";
import type { Product, Address, OrderItem } from "@/lib/types";
type Quote = {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  cartRaw: string;
};
export function Checkout({
  products,
  mode,
}: {
  products: Product[];
  mode: string;
}) {
  const cart = useCart();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    fetch("/api/session", { method: "POST" })
      .then((r) => {
        if (!r.ok) throw new Error("Oturum başlatılamadı.");
        if (active) setReady(true);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!cart.items.length) return;
    const c = new AbortController();
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cart.items),
      signal: c.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => {
        setQuote({ ...d, cartRaw: cart.raw });
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setQuote(null);
          setError(e.message);
        }
      });
    return () => c.abort();
  }, [cart.items, cart.raw, revision]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const fd = new FormData(e.currentTarget);
      const address = Object.fromEntries(fd.entries()) as Address;
      if (!quote || quote.cartRaw !== cart.raw)
        throw new Error("Sepet güncelleniyor, lütfen bekleyin.");
      const payload = {
        items: cart.items,
        address,
        expectedTotal: quote.total,
      };
      const fingerprint = JSON.stringify(payload);
      let prior: { fingerprint: string; key: string } | null = null;
      try {
        prior = JSON.parse(
          sessionStorage.getItem("checkout-attempt") || "null",
        );
      } catch {}
      const key =
        prior?.fingerprint === fingerprint ? prior.key : crypto.randomUUID();
      sessionStorage.setItem(
        "checkout-attempt",
        JSON.stringify({ fingerprint, key }),
      );
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, key }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (r.status === 409) setRevision((v) => v + 1);
        throw new Error(d.error);
      }
      cart.clear();
      router.push(d.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sipariş oluşturulamadı.");
      setBusy(false);
    }
  }
  if (!cart.items.length)
    return (
      <div className="empty">
        <p className="eyebrow">BİR ŞEYLER EKSİK</p>
        <h1>Sepetiniz henüz boş.</h1>
        <p>Gününüze eşlik edecek parçaları keşfedin.</p>
        <Link href="/#koleksiyon" className="button">
          Koleksiyona dön <ArrowRight size={18} />
        </Link>
      </div>
    );
  return (
    <div className="checkout-grid">
      <div>
        <section className="cart-items">
          {cart.items.map((l) => {
            const p = products.find((p) => p.id === l.productId);
            return (
              <div className="cart-item" key={l.productId}>
                {p && (
                  <Image src={p.image} alt={p.name} width={110} height={110} />
                )}
                <div>
                  <h3>{p?.name || "Kaldırılmış ürün"}</h3>
                  <p>{p ? money(p.price) : "Ürün artık satışta değil"}</p>
                  <button
                    className="text-button"
                    onClick={() => cart.set(l.productId, 0)}
                  >
                    Kaldır
                  </button>
                </div>
                <div className="quantity">
                  <button
                    aria-label="Adedi azalt"
                    onClick={() => cart.set(l.productId, l.quantity - 1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{l.quantity}</span>
                  <button
                    aria-label="Adedi artır"
                    disabled={!p || l.quantity >= Math.min(p.stock, 20)}
                    onClick={() => cart.set(l.productId, l.quantity + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </section>
        <section className="address-form">
          <p className="eyebrow">01 / TESLİMAT BİLGİLERİ</p>
          <h2>Size nereden ulaşalım?</h2>
          <p className="muted">
            {mode === "demo"
              ? "Demo için örnek bilgiler kullanın."
              : "Teslimat adresinizi ve iletişim bilgilerinizi girin."}
          </p>
          <form id="checkout" onSubmit={submit}>
            <div className="form-grid">
              <label>
                Ad soyad
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={3}
                  maxLength={60}
                />
              </label>
              <label>
                E-posta
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={100}
                />
              </label>
              <label>
                Telefon
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  pattern="(\+90|0)?5[0-9]{9}"
                  placeholder="05XXXXXXXXX"
                  maxLength={20}
                />
              </label>
              <label>
                İl
                <input
                  name="city"
                  autoComplete="address-level1"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </label>
              <label>
                İlçe
                <input
                  name="district"
                  autoComplete="address-level2"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </label>
              <label>
                Posta kodu
                <input
                  name="postalCode"
                  autoComplete="postal-code"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  maxLength={5}
                />
              </label>
              <label className="span-two">
                Açık adres
                <textarea
                  name="address"
                  autoComplete="street-address"
                  required
                  minLength={10}
                  maxLength={250}
                  rows={3}
                />
              </label>
            </div>
          </form>
        </section>
      </div>
      <aside className="order-summary">
        <p className="eyebrow">02 / SİPARİŞ ÖZETİ</p>
        <h2>Son bir bakış.</h2>
        {quote ? (
          <>
            <dl>
              <div>
                <dt>Ürünler</dt>
                <dd>{money(quote.subtotal)}</dd>
              </div>
              <div>
                <dt>Kargo</dt>
                <dd>{quote.shipping ? money(quote.shipping) : "Ücretsiz"}</dd>
              </div>
              <div>
                <dt>Dahil olan KDV</dt>
                <dd>{money(quote.tax)}</dd>
              </div>
              <div className="summary-total">
                <dt>Toplam</dt>
                <dd>{money(quote.total)}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p>Sepet hesaplanıyor…</p>
        )}
        <p className="muted">
          {mode === "demo"
            ? "Demo ödeme ekranında başarılı veya başarısız sonucu deneyebilirsiniz. Kart bilgisi istenmez."
            : "Kart bilgilerinizi PayTR’ın güvenli ödeme ekranına gireceksiniz."}
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button
          form="checkout"
          className="button full"
          disabled={!ready || !quote || quote.cartRaw !== cart.raw || busy}
        >
          {busy
            ? "Sipariş hazırlanıyor…"
            : mode === "demo"
              ? "Demo ödemeye geç"
              : "PayTR ile öde"}
          <ArrowRight size={18} />
        </button>
        <p className="fine-print">
          Fiyat ve stok bilgileri sipariş anında tekrar kontrol edilir.
        </p>
      </aside>
    </div>
  );
}

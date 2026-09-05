"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { money } from "@/config/store";
async function request(url: string, data: unknown, method = "POST") {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "İşlem başarısız.");
  return d;
}
export function AdminLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const fd = new FormData(e.currentTarget);
        try {
          await request("/api/admin/login", { password: fd.get("password") });
          router.push("/admin");
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Giriş başarısız.");
          setBusy(false);
        }
      }}
    >
      <label>
        Yönetici parolası
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          maxLength={256}
        />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="button full" disabled={busy}>
        {busy ? "Giriş yapılıyor…" : "Yönetim paneline gir"}
      </button>
    </form>
  );
}
export function AdminLogout() {
  const router = useRouter();
  return (
    <button
      className="secondary-button"
      onClick={async () => {
        await request("/api/admin/logout", {});
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Çıkış yap
    </button>
  );
}
export function ProductEditor({ product: p }: { product: Product }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="product-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const fd = new FormData(e.currentTarget);
        try {
          await request(
            "/api/admin/products",
            {
              id: p.id,
              name: fd.get("name"),
              price: Math.round(Number(fd.get("price")) * 100),
              stock: Number(fd.get("stock")),
              active: fd.get("active") === "on",
            },
            "PATCH",
          );
          setMessage("Kaydedildi.");
          router.refresh();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Kaydedilemedi.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Ürün adı
        <input
          name="name"
          defaultValue={p.name}
          required
          minLength={2}
          maxLength={100}
        />
      </label>
      <label>
        Fiyat (TL, KDV dahil)
        <input
          type="number"
          name="price"
          step="0.01"
          min="0.01"
          defaultValue={(p.price / 100).toFixed(2)}
          required
        />
      </label>
      <label>
        Satılabilir stok
        <input
          type="number"
          name="stock"
          min="0"
          max="1000000"
          defaultValue={p.stock}
          required
        />
      </label>
      <label className="checkbox">
        <input type="checkbox" name="active" defaultChecked={!!p.active} />
        Satışta
      </label>
      <button className="small-button" disabled={busy}>
        Kaydet
      </button>
      <output>{message}</output>
    </form>
  );
}
export function NewProduct() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <details className="panel">
      <summary>+ Yeni ürün ekle</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          const form = e.currentTarget;
          const fd = new FormData(form);
          try {
            await request("/api/admin/products", {
              name: fd.get("name"),
              slug: fd.get("slug"),
              description: fd.get("description"),
              category: fd.get("category"),
              image: fd.get("image"),
              vat: Number(fd.get("vat")),
              price: Math.round(Number(fd.get("price")) * 100),
              stock: Number(fd.get("stock")),
              active: true,
            });
            setMessage("Ürün eklendi.");
            form.reset();
            router.refresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Eklenemedi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label>
            Ürün adı
            <input name="name" required minLength={2} maxLength={100} />
          </label>
          <label>
            Ürün adresi
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="yeni-urun"
              maxLength={100}
            />
          </label>
          <label>
            Fiyat (TL)
            <input name="price" type="number" step="0.01" min="0.01" required />
          </label>
          <label>
            Satılabilir stok
            <input name="stock" type="number" min="0" max="1000000" required />
          </label>
          <label>
            Kategori
            <select name="category">
              {["Seramik", "Tekstil", "Mutfak", "Setler"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            KDV (%)
            <select name="vat">
              {[20, 10, 1, 0].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Örnek görsel
            <select name="image">
              <option value="/images/cup.png">Kupa</option>
              <option value="/images/linen.png">Keten</option>
              <option value="/images/board.png">Sunum tahtası</option>
              <option value="/images/collection.png">Koleksiyon</option>
            </select>
          </label>
          <label className="span-two">
            Açıklama
            <textarea
              name="description"
              minLength={10}
              maxLength={1000}
              required
            />
          </label>
        </div>
        <button className="small-button" disabled={busy}>
          Ürün oluştur
        </button>
        <output>{message}</output>
      </form>
    </details>
  );
}
export function ShipOrder({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="ship-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await request("/api/admin/ship", {
            id,
            tracking: new FormData(e.currentTarget).get("tracking"),
          });
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Kaydedilemedi.");
          setBusy(false);
        }
      }}
    >
      <label>
        Kargo takip numarası
        <input name="tracking" minLength={3} maxLength={100} required />
      </label>
      <button className="small-button" disabled={busy}>
        Kargoya verildi
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}
export function Revenue({ amount }: { amount: number }) {
  return <strong>{money(amount)}</strong>;
}

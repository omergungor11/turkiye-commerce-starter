"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export function DemoPayment({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function pay(status: string) {
    setBusy(true);
    try {
      const r = await fetch(`/api/orders/${id}/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.push(d.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem başarısız.");
      setBusy(false);
    }
  }
  return (
    <div className="demo-payment">
      <p>
        Bu bir ödeme simülasyonudur. Kart bilgisi girilmez ve para çekilmez.
      </p>
      <button
        className="button full"
        disabled={busy}
        onClick={() => pay("success")}
      >
        Başarılı ödemeyi dene
      </button>
      <button
        className="secondary-button full"
        disabled={busy}
        onClick={() => pay("failed")}
      >
        Başarısız ödemeyi dene
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function RefreshOrder({ pending }: { pending: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [pending, router]);
  return (
    <button className="secondary-button" onClick={() => router.refresh()}>
      Durumu yenile
    </button>
  );
}

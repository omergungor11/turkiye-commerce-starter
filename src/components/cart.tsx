"use client";
import { useSyncExternalStore, useState, useMemo } from "react";
import Link from "next/link";
import { ShoppingBag, Plus, ArrowUpRight } from "lucide-react";
import type { CartLine } from "@/lib/types";
const key = "doku-cart-v1";
const event = "doku-cart";
function subscribe(fn: () => void) {
  window.addEventListener("storage", fn);
  window.addEventListener(event, fn);
  return () => {
    window.removeEventListener("storage", fn);
    window.removeEventListener(event, fn);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(key) || "[]";
  } catch {
    return "[]";
  }
}
export function useCart() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const items = useMemo(() => {
    let items: CartLine[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        items = parsed.filter(
          (l) =>
            typeof l?.productId === "string" &&
            Number.isInteger(l.quantity) &&
            l.quantity > 0 &&
            l.quantity <= 20,
        );
    } catch {}
    return items;
  }, [raw]);
  const write = (next: CartLine[]) => {
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event(event));
  };
  return {
    items,
    raw,
    count: items.reduce((s, l) => s + l.quantity, 0),
    set: (productId: string, quantity: number) =>
      write([
        ...items.filter((l) => l.productId !== productId),
        ...(quantity > 0
          ? [{ productId, quantity: Math.min(20, quantity) }]
          : []),
      ]),
    clear: () => write([]),
  };
}
export function CartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/sepet"
      className="cart-link"
      aria-label={`Sepetim, ${count} ürün`}
    >
      <ShoppingBag size={19} aria-hidden="true" />
      <span>Sepetim</span>
      <b>{count}</b>
    </Link>
  );
}
export function AddToCart({
  id,
  stock,
  large = false,
}: {
  id: string;
  stock: number;
  large?: boolean;
}) {
  const cart = useCart();
  const [added, setAdded] = useState(false);
  const quantity = cart.items.find((l) => l.productId === id)?.quantity || 0;
  const disabled = quantity >= Math.min(stock, 20);
  return (
    <button
      className={large ? "button full" : "add-button"}
      disabled={disabled}
      onClick={() => {
        cart.set(id, quantity + 1);
        setAdded(true);
      }}
      aria-label={stock === 0 ? "Stokta yok" : "Sepete ekle"}
    >
      {large ? (
        stock === 0 ? (
          "Stokta yok"
        ) : disabled ? (
          "Adet sınırına ulaştınız"
        ) : added ? (
          "Sepete eklendi"
        ) : (
          "Sepete ekle"
        )
      ) : added ? (
        "✓"
      ) : (
        <Plus size={19} aria-hidden="true" />
      )}
      {large && <ArrowUpRight size={19} aria-hidden="true" />}
    </button>
  );
}

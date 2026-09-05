import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Package, ShieldCheck } from "lucide-react";
import { CartLink } from "@/components/cart";
import { store } from "@/config/store";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: { default: "Doku — Türkiye E-ticaret Starter", template: "%s · Doku" },
  description: store.description,
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demo = (process.env.PAYMENT_PROVIDER || "demo") === "demo";
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#content">
          İçeriğe geç
        </a>
        <div className="announcement">
          {demo
            ? "DEMO MAĞAZA · Gerçek ödeme alınmaz"
            : "PAYTR " +
              (process.env.PAYTR_TEST_MODE === "1"
                ? "TEST MAĞAZASI · Gerçek ödeme alınmaz"
                : "")}
          <span>
            1.500 TL ve üzeri ücretsiz kargo{" "}
            <ArrowUpRight size={12} aria-hidden="true" />
          </span>
        </div>
        <header className="site-header wrap">
          <Link href="/" className="wordmark">
            doku
          </Link>
          <nav aria-label="Ana menü">
            <Link href="/#koleksiyon">Koleksiyonu keşfet</Link>
            <Link href="/?kategori=Seramik#koleksiyon">Seramik</Link>
            <Link href="/?kategori=Tekstil#koleksiyon">Tekstil</Link>
          </nav>
          <CartLink />
        </header>
        <main id="content">{children}</main>
        <div className="trust-row wrap">
          <span>
            <Package size={19} />
            Şeffaf kargo ücreti
          </span>
          <span>
            <ShieldCheck size={19} />
            {demo ? "Anahtarsız demo ödeme" : "Kart bilgileri PayTR ekranında"}
          </span>
          <span>Az eşya, iyi his.</span>
        </div>
        <footer className="footer wrap">
          <div>
            <Link href="/" className="wordmark">
              doku
            </Link>
            <p>{store.tagline}</p>
          </div>
          <div className="footer-links">
            <Link href="/bilgi">Bu mağaza hakkında</Link>
            <Link href="/admin">Yönetim paneli</Link>
            <a href="https://github.com/omergungor11/turkiye-commerce-starter">
              GitHub <ArrowUpRight size={14} />
            </a>
          </div>
          <p className="footer-note">
            Örnek marka ve ürünler. Türkiye E-ticaret Starter · Next.js + PayTR
          </p>
        </footer>
      </body>
    </html>
  );
}

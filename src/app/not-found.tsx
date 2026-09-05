import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty">
      <h1>Burada bir şey bulamadık.</h1>
      <p>
        Bağlantıyı veya siparişinizi oluşturduğunuz tarayıcıyı kontrol edin.
      </p>
      <Link className="button" href="/">
        Mağazaya dön
      </Link>
    </div>
  );
}

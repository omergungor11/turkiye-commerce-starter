import { AdminLogin } from "@/components/admin";
export const metadata = { title: "Yönetici girişi" };
export default function Login() {
  return (
    <div className="wrap page narrow">
      <p className="eyebrow">DOKU / YÖNETİM</p>
      <h1 className="page-title">Tekrar merhaba.</h1>
      <div className="panel">
        <p>Kurulumda oluşturduğunuz yönetici parolasıyla giriş yapın.</p>
        <AdminLogin />
      </div>
    </div>
  );
}

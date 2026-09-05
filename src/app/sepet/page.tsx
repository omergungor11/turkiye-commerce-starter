import { Checkout } from "@/components/checkout";
import { products } from "@/lib/commerce";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sepetim" };
export default function CartPage() {
  return (
    <div className="wrap page">
      <p className="eyebrow">SİZE EŞLİK EDECEK PARÇALAR</p>
      <h1 className="page-title">Sepetim.</h1>
      <Checkout
        products={products()}
        mode={process.env.PAYMENT_PROVIDER || "demo"}
      />
    </div>
  );
}

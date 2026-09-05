export const store = {
  name: "doku",
  tagline: "Gündelik hayatın iyi hissettiren parçaları.",
  description:
    "Türkiye E-ticaret Starter için hazırlanmış örnek ev ve yaşam mağazası.",
  currency: "TRY",
  shippingCents: 7990,
  freeShippingThreshold: 150000,
  shippingVat: 20,
  email: "merhaba@example.com",
  categories: ["Tümü", "Seramik", "Tekstil", "Mutfak", "Setler"],
};
export function money(cents: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(cents / 100);
}

import type { Product } from "./types";
export const seedProducts: Product[] = [
  {
    id: "p1",
    slug: "toprak-seramik-kupa",
    name: "Toprak Seramik Kupa",
    description:
      "Yavaş sabahlar ve kahve molaları için sade bir kupa. Örnek ürün; görseller yapay zekâ ile üretilmiştir.",
    category: "Seramik",
    price: 34900,
    vat: 20,
    stock: 24,
    image: "/images/cup.png",
    active: 1,
  },
  {
    id: "p2",
    slug: "dogal-keten-bez",
    name: "Doğal Keten Bez",
    description:
      "Sofranıza ve mutfağınıza doğal bir dokunuş. Örnek ürün; görseller yapay zekâ ile üretilmiştir.",
    category: "Tekstil",
    price: 22900,
    vat: 20,
    stock: 30,
    image: "/images/linen.png",
    active: 1,
  },
  {
    id: "p3",
    slug: "mese-sunum-tahtasi",
    name: "Meşe Sunum Tahtası",
    description:
      "Birlikte geçirilen sofralar için yalın bir sunum parçası. Örnek ürün; görseller yapay zekâ ile üretilmiştir.",
    category: "Mutfak",
    price: 54900,
    vat: 20,
    stock: 18,
    image: "/images/board.png",
    active: 1,
  },
  {
    id: "p4",
    slug: "evde-yavas-bir-gun",
    name: "Evde Yavaş Bir Gün",
    description:
      "Kupa, keten bez, sunum tahtası ve seramik kaseden oluşan örnek hediye seti. Ayrı stoklanan tek bir set ürünü olarak satılır.",
    category: "Setler",
    price: 129900,
    vat: 20,
    stock: 8,
    image: "/images/collection.png",
    active: 1,
  },
];

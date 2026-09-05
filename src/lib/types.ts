export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  vat: number;
  stock: number;
  image: string;
  active: number;
};
export type CartLine = { productId: string; quantity: number };
export type Address = {
  name: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  postalCode: string;
};
export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vat: number;
};
export type Order = {
  id: string;
  session_hash: string;
  request_key: string;
  fingerprint: string;
  status: "pending" | "paid" | "failed";
  fulfillment: "unfulfilled" | "shipped";
  payment_mode: "demo" | "paytr-test" | "paytr-live";
  address: Address;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  created_at: string;
  tracking: string;
  payment_token: string | null;
};
export class CommerceError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

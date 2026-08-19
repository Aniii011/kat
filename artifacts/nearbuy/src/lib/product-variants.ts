export interface ProductVariant {
  id: string;
  attributes: Record<string, string>; // e.g. { color: "Black", size: "M" }
  sku?: string;
  price?: number;
  stock?: number;
}

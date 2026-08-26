export type SellerCategoryId =
  | "Fashion"
  | "Shoes"
  | "Electronics"
  | "Beauty & Health"
  | "Home"
  | "Jewelry & Accessories"
  | "Gym & Outdoor"
  | "Thrift";

export interface SellerCategoryDef {
  id: SellerCategoryId;
  label: string;
  emoji: string;
}

export const SELLER_CATEGORIES: SellerCategoryDef[] = [
  { id: "Fashion", label: "Fashion", emoji: "✨" },
  { id: "Shoes", label: "Shoes", emoji: "👟" },
  { id: "Electronics", label: "Electronics", emoji: "📱" },
  { id: "Beauty & Health", label: "Beauty & Health", emoji: "💄" },
  { id: "Home", label: "Home", emoji: "🏠" },
  { id: "Jewelry & Accessories", label: "Jewelry & Accessories", emoji: "💍" },
  { id: "Gym & Outdoor", label: "Gym & Outdoor", emoji: "🏋️" },
  { id: "Thrift", label: "Thrift", emoji: "♻️" },
];

// Maps a seller specialization to the existing canonical TOP_CATEGORIES values
// (from @/data/listings) it corresponds to when writing products.category.
// Fashion is the only one that fans out to multiple existing top categories
// (its internal Women's/Men's/Kids department step). Everything else maps 1:1.
//
// FLAG: "Electronics" (the seller-facing label) maps to the existing canonical
// value "Phone & Accessories" — the underlying TOP_CATEGORIES/SUBCATEGORIES
// data does not have a category literally named "Electronics". This is
// intentional (reusing existing taxonomy per the approved plan), but the
// naming mismatch is worth confirming you're fine with — sellers will see
// "Electronics" as their specialty, while products.category ends up storing
// "Phone & Accessories" under the hood, exactly as today's canonical data
// defines it.
export const SELLER_CATEGORY_TO_TOP_CATEGORIES: Record<SellerCategoryId, string[]> = {
  Fashion: ["Woman", "Men", "Kids"],
  Shoes: ["Shoes"],
  Electronics: ["Phone & Accessories"],
  "Beauty & Health": ["Beauty & Health"],
  Home: ["Home"],
  "Jewelry & Accessories": ["Jewelry & Accessories"],
  "Gym & Outdoor": ["Gym & Outdoor"],
  Thrift: [], // deliberate — Thrift never uses TOP_CATEGORIES/SUBCATEGORIES
};

// Thrift's flat, fast item-type list. This IS Thrift's only "category
// selection" — there is no separate subcategory picker for Thrift sellers,
// and this list is never derived from or mixed with SUBCATEGORIES.
export const THRIFT_ITEM_TYPES = [
  "Dress",
  "Top",
  "Bottom",
  "Jacket",
  "Shoes",
  "Bag",
  "Accessories",
  "Kids",
  "Other",
] as const;

export type ThriftItemType = (typeof THRIFT_ITEM_TYPES)[number];

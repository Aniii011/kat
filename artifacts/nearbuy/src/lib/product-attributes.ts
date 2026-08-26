// Rewritten against the approved Final Field Matrix. No Storage/RAM/Shoe Type/
// Key Specs. No fields beyond what was explicitly approved. Only Thrift's
// Condition (handled separately in thrift-config.ts) is required anywhere.

import { COLORS, CLOTHING_SIZES, SHOE_SIZES } from "./product-option-sets";

export type AttributeFieldType = "select" | "multiselect" | "text";

export interface AttributeField {
  id: string;
  label: string;
  type: AttributeFieldType;
  options?: string[];
  required?: boolean;
}

// ── Fashion ──
export const FASHION_FIT_OPTIONS = ["Slim", "Regular", "Loose", "Oversized"];
export const FASHION_MATERIAL_OPTIONS = [
  "Cotton", "Linen", "Denim", "Polyester", "Silk", "Wool", "Leather", "Chiffon", "Ankara", "Lace",
];
export const FASHION_OCCASION_OPTIONS = [
  "Casual", "Formal", "Party", "Office", "Sports", "Beach", "Wedding", "Everyday",
];
export const FASHION_AUDIENCE_OPTIONS = ["Women", "Men", "Girls", "Boys", "Babies", "Teens", "Unisex"];
export const FASHION_COLOR_OPTIONS = COLORS;
export const FASHION_SIZE_OPTIONS = CLOTHING_SIZES;

// ── Shoes ── (no Shoe Type field — subcategory already conveys it)
export const SHOES_MATERIAL_OPTIONS = ["Leather", "Canvas", "Suede", "Synthetic", "Rubber"];
export const SHOES_COLOR_OPTIONS = COLORS;
export const SHOES_SIZE_OPTIONS = SHOE_SIZES;

// ── Electronics ── (no Storage/RAM/Key Specs — not built, matches current
// canonical "Phone & Accessories" subcategories only: Cases, Chargers,
// Earphones, Powerbanks — none of which need those fields anyway)
export const ELECTRONICS_CONDITION_OPTIONS = ["New", "Used - Like New", "Used - Good", "Used - Fair"];
export const ELECTRONICS_WARRANTY_OPTIONS = ["None", "3 months", "6 months", "1 year"];

// ── Beauty & Health ── (Expiry Date lives ONLY in MoreOptionsAccordion — not
// listed here since it's not a "Details" field)
// Shade/Type and Volume/Size are free text — beauty product naming varies too
// widely for a fixed option list to be genuinely useful.

// ── Home ──
// FLAG: Material is free text here (not a fixed select), since home-product
// materials (wood, plastic, metal, fabric, glass...) vary too widely for one
// clean option list without inventing a speculative taxonomy. Confirm this
// judgment call is acceptable, or supply a fixed list you'd prefer instead.
export const HOME_POWER_SOURCE_OPTIONS = ["Electric", "Battery", "Manual"];
export const HOME_APPLIANCES_SUBCATEGORY = "Appliances"; // exact SUBCATEGORIES label this gates on

// ── Jewelry & Accessories ──
// FLAG: this Material option list was not given verbatim in your instructions —
// it's a small, reasonable set I composed. Confirm or replace.
export const JEWELRY_MATERIAL_OPTIONS = ["Gold", "Gold-plated", "Silver", "Beaded", "Leather", "Fabric"];
export const JEWELRY_COLOR_OPTIONS = COLORS;
export const JEWELRY_ADJUSTABLE_OPTIONS = ["Yes", "No"];

// ── Gym & Outdoor ──
// FLAG: same free-text judgment call as Home's Material, for the same reason.
export const GYM_WEAR_SUBCATEGORY = "Gym Wear"; // exact SUBCATEGORIES label this gates on
export const GYM_SIZE_OPTIONS = CLOTHING_SIZES;
export const GYM_COLOR_OPTIONS = COLORS;

// Field ids that map to existing dedicated `products` columns instead of the
// generic `attributes` jsonb blob. NOTE: "length" is intentionally NOT
// included — the approved Fashion matrix dropped Length entirely. The
// products.length column still exists in the schema (used by old/legacy
// products) but the new composer never writes to it. Flagging this so it's
// understood as deliberate, not an oversight.
export const NATIVE_ATTRIBUTE_COLUMNS = new Set(["audience", "fit", "material", "occasion"]);
export function getAttributeFieldsForSubcategory(
  _subcategory: string
): AttributeField[] {
  return [];
}

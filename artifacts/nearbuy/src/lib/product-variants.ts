// Shared variant logic for KAT's variant/SKU system.
//
// products.variants (JSONB) is the single source of truth for any product
// that has variants. Nothing here touches Supabase, the seller form, the
// product page, cart, or checkout — those are later stages. This file only
// defines the rules everything else will be built on.

export interface ProductVariant {
  id: string;
  attributes: Record<string, string>; // e.g. { color: "Black", size: "M" }
  sku?: string;
  price?: number;   // seller price for this specific variant, if it differs
  stock?: number;   // undefined = not stock-tracked (legacy/untracked); 0 = out of stock
}

export interface VariantOption {
  name: string;     // e.g. "color", "size", "shoeSize"
  values: string[]; // e.g. ["White", "Black"]
}

// KAT's platform fee. Kept as its own constant here (not imported from
// admin.tsx, which has its own COMMISSION_RATE for a different purpose —
// platform revenue reporting on the finance ledger, not the seller-price-to
// customer-price conversion this file does). Flagging this so it's a
// conscious choice, not an oversight: two constants, same number, different
// jobs. If you'd rather have one shared constant, say so and I'll wire it.
export const PLATFORM_FEE_RATE = 0.095;

// ---------------------------------------------------------------------------
// Reading legacy / mixed variant shapes
// ---------------------------------------------------------------------------

// Older saved variants may be flat (no `attributes` wrapper) — this is the
// exact shape seller.tsx's edit-mode code already defends against when
// loading a product to edit. Centralizing it here so every consumer reads
// variants the same way.
export function normalizeVariant(raw: any): ProductVariant {
  if (raw && typeof raw === "object" && raw.attributes && typeof raw.attributes === "object") {
    return {
      id: raw.id || cryptoRandomId(),
      attributes: { ...raw.attributes },
      sku: raw.sku || undefined,
      price: raw.price !== undefined && raw.price !== null && raw.price !== "" ? Number(raw.price) : undefined,
      stock: raw.stock !== undefined && raw.stock !== null && raw.stock !== "" ? Number(raw.stock) : undefined,
    };
  }
  // Flat legacy shape: { id?, color?, size?, shoeSize?, price?, stock?, sku? }
  const attributes: Record<string, string> = {};
  if (raw?.color) attributes.color = raw.color;
  if (raw?.size) attributes.size = raw.size;
  if (raw?.shoeSize) attributes.shoeSize = raw.shoeSize;
  return {
    id: raw?.id || cryptoRandomId(),
    attributes,
    sku: raw?.sku || undefined,
    price: raw?.price !== undefined && raw?.price !== null && raw?.price !== "" ? Number(raw.price) : undefined,
    stock: raw?.stock !== undefined && raw?.stock !== null && raw?.stock !== "" ? Number(raw.stock) : undefined,
  };
}

export function normalizeVariants(raw: any): ProductVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeVariant);
}

function cryptoRandomId(): string {
  // Matches the id style already used in seller.tsx (Math.random().toString(36))
  // rather than introducing a new id format into existing data.
  return Math.random().toString(36).slice(2);
}

// ---------------------------------------------------------------------------
// Attribute comparison — the core of "does this variant match that selection"
// ---------------------------------------------------------------------------

// Two attribute sets are the same combination if they have the exact same
// keys and values, regardless of key order. Used for both matching a
// customer's selection to a variant, and matching a regenerated combination
// to an existing one.
export function sameAttributes(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

// ---------------------------------------------------------------------------
// 1. Generating Cartesian combinations, preserving existing variant data
// ---------------------------------------------------------------------------

// Builds every combination of the given options, in the order: first option
// varies slowest (outermost loop), last option varies fastest (innermost) —
// e.g. Color=[White,Black] x Size=[36,37] produces:
//   White/36, White/37, Black/36, Black/37
// NOT White/36, Black/37 (one variant per option) and NOT any other order.
//
// Existing variants are matched by exact attribute combination and preserved
// in full (id, sku, price, stock) — regenerating never resets a combination
// that already existed. A brand-new combination gets a fresh id and an
// auto-suggested SKU, but NO default stock — stock is left undefined
// (incomplete) so Stage 2 can block publishing until the seller sets it.
export function generateVariantCombinations(
  options: VariantOption[],
  existing: ProductVariant[] = [],
  skuPrefix: string = "SKU"
): ProductVariant[] {
  const validOptions = options.filter((o) => o.values.length > 0);
  if (validOptions.length === 0) return [];

  let combos: Record<string, string>[] = [{}];
  for (const option of validOptions) {
    const next: Record<string, string>[] = [];
    for (const combo of combos) {
      for (const value of option.values) {
        next.push({ ...combo, [option.name]: value });
      }
    }
    combos = next;
  }

  return combos.map((attrs) => {
    const match = existing.find((v) => sameAttributes(v.attributes, attrs));
    if (match) {
      // Preserve exactly as-is: id, sku, stock, price untouched.
      return match;
    }
    return {
      id: cryptoRandomId(),
      attributes: attrs,
      sku: suggestSku(skuPrefix, attrs),
      price: undefined,
      stock: undefined, // intentionally incomplete — never defaulted
    };
  });
}

// A readable starting SKU the seller can edit — not authoritative, just a
// convenience so they aren't starting from a blank field for every row.
// e.g. suggestSku("SHOE", { color: "White", size: "38" }) -> "SHOE-WHITE-38"
export function suggestSku(prefix: string, attrs: Record<string, string>): string {
  const parts = Object.values(attrs).map((v) =>
    v.toString().toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 6)
  );
  return [prefix.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8), ...parts].filter(Boolean).join("-");
}

// Which combinations from `existing` are NOT present in `regenerated`, i.e.
// combinations the seller is about to remove by changing the option values.
// Stage 1 only detects this — it never deletes anything. Stage 2 uses this
// list to warn the seller before removing a combination that has stock.
export function findRemovedVariants(
  existing: ProductVariant[],
  regenerated: ProductVariant[]
): ProductVariant[] {
  return existing.filter((e) => !regenerated.some((r) => sameAttributes(r.attributes, e.attributes)));
}

// ---------------------------------------------------------------------------
// 2. Deriving the customer-facing options from saved variants
// ---------------------------------------------------------------------------

// Reconstructs the option list (names + values) directly from the saved
// variants — this is what the customer-facing page should build its
// Color/Size buttons from, instead of the separate colors/clothing_sizes/
// shoe_sizes columns. Value order follows first-appearance in the variants
// array, which follows the seller's original option-value order from
// generation (see note in the test file about numeric sizes).
export function deriveOptionsFromVariants(variants: ProductVariant[]): VariantOption[] {
  const order: string[] = [];
  const valuesByName = new Map<string, string[]>();

  for (const v of variants) {
    for (const [name, value] of Object.entries(v.attributes)) {
      if (!valuesByName.has(name)) {
        valuesByName.set(name, []);
        order.push(name);
      }
      const values = valuesByName.get(name)!;
      if (!values.includes(value)) values.push(value);
    }
  }

  return order.map((name) => ({ name, values: valuesByName.get(name)! }));
}

// ---------------------------------------------------------------------------
// 3. Finding the exact variant from a customer's selection
// ---------------------------------------------------------------------------

// Returns the one variant matching every selected attribute. Returns
// undefined if the selection doesn't fully identify a single variant yet
// (e.g. color chosen but size isn't) — callers should treat undefined as
// "selection incomplete", not "out of stock".
export function findVariant(
  variants: ProductVariant[],
  selected: Record<string, string>
): ProductVariant | undefined {
  const options = deriveOptionsFromVariants(variants);
  const allSelected = options.every((o) => selected[o.name]);
  if (!allSelected) return undefined;
  return variants.find((v) => sameAttributes(v.attributes, selected));
}

// ---------------------------------------------------------------------------
// 4. Availability / stock
// ---------------------------------------------------------------------------

// undefined stock = not stock-tracked for this variant (legacy data, or a
// variant that predates stock tracking) — treated as available, matching
// how listing-detail.tsx already treats a null product-level stock today.
// 0 = out of stock. Anything else = available.
export function isVariantAvailable(variant: ProductVariant | undefined): boolean {
  if (!variant) return false;
  if (variant.stock === undefined || variant.stock === null) return true;
  return variant.stock > 0;
}

// A variant is "incomplete" — not safe to publish — only when it has no
// stock value at all. This is what Stage 2 will check before allowing
// "Publish Product" when variants exist. Never silently fills this in.
export function variantNeedsStock(variant: ProductVariant): boolean {
  return variant.stock === undefined || variant.stock === null;
}

export function hasIncompleteVariants(variants: ProductVariant[]): boolean {
  return variants.some(variantNeedsStock);
}

// ---------------------------------------------------------------------------
// 5. Price resolution — one function, used by both the product page and the
//    server, so they can never compute a different number from each other.
// ---------------------------------------------------------------------------

export interface ResolvedPrice {
  sellerPrice: number;   // what the seller set (variant's own, or the product's)
  customerPrice: number; // sellerPrice + KAT's platform fee, rounded the same
                          // way as the existing seller.tsx calculation
}

// If the variant has its own price, that's authoritative. Otherwise falls
// back to the product's base seller price. This does not change the 9.5%
// figure or how it's applied — same `Math.round(price * 1.095)` seller.tsx
// already uses — it just makes sure every caller does it identically.
export function resolveVariantPrice(
  variant: ProductVariant | undefined,
  productSellerPrice: number
): ResolvedPrice {
  const sellerPrice = variant?.price !== undefined && variant.price !== null
    ? variant.price
    : productSellerPrice;
  const customerPrice = Math.round(sellerPrice * (1 + PLATFORM_FEE_RATE));
  return { sellerPrice, customerPrice };
}

// ---------------------------------------------------------------------------
// 6. Per-variant pricing and stock helpers (seller form).
//    When "Different price per variant" is on, every variant must carry its own
//    price, and the product's overall stock is simply the sum of the variants.
// ---------------------------------------------------------------------------

export function variantNeedsPrice(variant: ProductVariant): boolean {
  return variant.price === undefined || variant.price === null || !(Number(variant.price) > 0);
}

export function hasIncompletePricing(variants: ProductVariant[]): boolean {
  return variants.some(variantNeedsPrice);
}

// Cheapest variant price (seller price), used as the listing's "from" price.
export function lowestVariantPrice(variants: ProductVariant[]): number | null {
  const prices = variants
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function totalVariantStock(variants: ProductVariant[]): number {
  return variants.reduce((sum, v) => sum + (Number(v.stock) > 0 ? Number(v.stock) : 0), 0);
}

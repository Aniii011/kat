// Run with: npx tsx src/lib/product-variants.test.ts
// No test framework dependency — plain assertions so this runs anywhere.

import assert from "node:assert";
import {
  generateVariantCombinations,
  deriveOptionsFromVariants,
  findVariant,
  isVariantAvailable,
  variantNeedsStock,
  hasIncompleteVariants,
  resolveVariantPrice,
  normalizeVariant,
  normalizeVariants,
  findRemovedVariants,
  sameAttributes,
  suggestSku,
  type ProductVariant,
} from "./product-variants";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log("  ok -", name);
  } catch (err) {
    console.error("  FAIL -", name);
    throw err;
  }
}

console.log("product-variants.ts — Stage 1 tests\n");

// ---------------------------------------------------------------------------
test("generates the 6-combination Test Shoe example in the required order", () => {
  const variants = generateVariantCombinations([
    { name: "color", values: ["White", "Black"] },
    { name: "size", values: ["36", "37", "38"] },
  ]);
  assert.equal(variants.length, 6);
  const order = variants.map((v) => `${v.attributes.color}/${v.attributes.size}`);
  assert.deepEqual(order, [
    "White/36", "White/37", "White/38",
    "Black/36", "Black/37", "Black/38",
  ]);
});

test("new variants have no default stock — undefined, never 10", () => {
  const variants = generateVariantCombinations([
    { name: "color", values: ["White"] },
    { name: "size", values: ["38"] },
  ]);
  assert.equal(variants[0].stock, undefined);
  assert.equal(variantNeedsStock(variants[0]), true);
  assert.equal(hasIncompleteVariants(variants), true);
});

test("single-option generation works (size only, no color)", () => {
  const variants = generateVariantCombinations([{ name: "size", values: ["S", "M", "L"] }]);
  assert.equal(variants.length, 3);
  assert.deepEqual(variants.map((v) => v.attributes.size), ["S", "M", "L"]);
});

test("three-option generation (e.g. a product with color + size + material)", () => {
  const variants = generateVariantCombinations([
    { name: "color", values: ["Red", "Blue"] },
    { name: "size", values: ["S", "M"] },
    { name: "material", values: ["Cotton"] },
  ]);
  assert.equal(variants.length, 4); // 2 x 2 x 1
});

test("no options at all returns no variants (non-variant product stays non-variant)", () => {
  assert.deepEqual(generateVariantCombinations([]), []);
});

// ---------------------------------------------------------------------------
test("regenerating an existing combination preserves id, sku, stock, price exactly — the required White/38 example", () => {
  const existing: ProductVariant[] = [
    { id: "X", attributes: { color: "White", size: "38" }, sku: "ABC", stock: 7, price: 25000 },
  ];
  const regenerated = generateVariantCombinations(
    [
      { name: "color", values: ["White"] },
      { name: "size", values: ["38"] },
    ],
    existing
  );
  assert.equal(regenerated.length, 1);
  assert.deepEqual(regenerated[0], existing[0]);
});

test("regenerating with a new size adds it without disturbing existing combinations", () => {
  const existing: ProductVariant[] = [
    { id: "X", attributes: { color: "White", size: "36" }, sku: "ABC-36", stock: 7, price: 25000 },
    { id: "Y", attributes: { color: "White", size: "37" }, sku: "ABC-37", stock: 3, price: 25000 },
  ];
  const regenerated = generateVariantCombinations(
    [
      { name: "color", values: ["White"] },
      { name: "size", values: ["36", "37", "38"] }, // seller added 38
    ],
    existing
  );
  assert.equal(regenerated.length, 3);
  // 36 and 37 preserved exactly
  assert.deepEqual(regenerated.find((v) => v.attributes.size === "36"), existing[0]);
  assert.deepEqual(regenerated.find((v) => v.attributes.size === "37"), existing[1]);
  // 38 is new and incomplete
  const v38 = regenerated.find((v) => v.attributes.size === "38")!;
  assert.equal(v38.stock, undefined);
  assert.notEqual(v38.id, "X");
  assert.notEqual(v38.id, "Y");
});

test("findRemovedVariants detects a combination the seller is about to drop, without deleting anything", () => {
  const existing: ProductVariant[] = [
    { id: "X", attributes: { color: "White", size: "36" }, stock: 5 },
    { id: "Y", attributes: { color: "White", size: "37" }, stock: 0 },
  ];
  // Seller removes size 37 from the option values
  const regenerated = generateVariantCombinations(
    [{ name: "color", values: ["White"] }, { name: "size", values: ["36"] }],
    existing
  );
  const removed = findRemovedVariants(existing, regenerated);
  assert.equal(removed.length, 1);
  assert.equal(removed[0].id, "Y");
  // existing array itself is untouched (Stage 1 never deletes)
  assert.equal(existing.length, 2);
});

// ---------------------------------------------------------------------------
test("deriveOptionsFromVariants reconstructs options customers should see", () => {
  const variants = generateVariantCombinations([
    { name: "color", values: ["White", "Black"] },
    { name: "size", values: ["36", "37", "38"] },
  ]);
  const options = deriveOptionsFromVariants(variants);
  assert.equal(options.length, 2);
  assert.deepEqual(options.find((o) => o.name === "color")!.values, ["White", "Black"]);
  assert.deepEqual(options.find((o) => o.name === "size")!.values, ["36", "37", "38"]);
});

test("deriveOptionsFromVariants on a single-option product (size only)", () => {
  const variants = generateVariantCombinations([{ name: "size", values: ["S", "M", "L"] }]);
  const options = deriveOptionsFromVariants(variants);
  assert.equal(options.length, 1);
  assert.equal(options[0].name, "size");
});

test("deriveOptionsFromVariants on no variants returns no options", () => {
  assert.deepEqual(deriveOptionsFromVariants([]), []);
});

// ---------------------------------------------------------------------------
test("findVariant resolves White+38 and Black+38 to two DIFFERENT variants", () => {
  const variants = generateVariantCombinations([
    { name: "color", values: ["White", "Black"] },
    { name: "size", values: ["38"] },
  ]);
  const white38 = findVariant(variants, { color: "White", size: "38" });
  const black38 = findVariant(variants, { color: "Black", size: "38" });
  assert.ok(white38);
  assert.ok(black38);
  assert.notEqual(white38!.id, black38!.id);
});

test("findVariant returns undefined when the selection is incomplete (color picked, size not yet)", () => {
  const variants = generateVariantCombinations([
    { name: "color", values: ["White", "Black"] },
    { name: "size", values: ["38", "39"] },
  ]);
  const result = findVariant(variants, { color: "White" });
  assert.equal(result, undefined);
});

// ---------------------------------------------------------------------------
test("isVariantAvailable: stock 0 is unavailable, stock > 0 is available", () => {
  assert.equal(isVariantAvailable({ id: "1", attributes: {}, stock: 0 }), false);
  assert.equal(isVariantAvailable({ id: "2", attributes: {}, stock: 5 }), true);
});

test("isVariantAvailable: undefined stock (untracked/legacy) is available, matching existing listing-detail.tsx behavior", () => {
  assert.equal(isVariantAvailable({ id: "3", attributes: {} }), true);
});

test("isVariantAvailable: no variant found at all is unavailable (nothing to add to cart)", () => {
  assert.equal(isVariantAvailable(undefined), false);
});

// ---------------------------------------------------------------------------
test("resolveVariantPrice uses the variant's own price when set", () => {
  const variant: ProductVariant = { id: "1", attributes: { color: "Black" }, price: 27000 };
  const { sellerPrice, customerPrice } = resolveVariantPrice(variant, 25000);
  assert.equal(sellerPrice, 27000);
  assert.equal(customerPrice, Math.round(27000 * 1.095));
});

test("resolveVariantPrice falls back to the product price when the variant has none", () => {
  const variant: ProductVariant = { id: "1", attributes: { color: "White" } };
  const { sellerPrice, customerPrice } = resolveVariantPrice(variant, 25000);
  assert.equal(sellerPrice, 25000);
  assert.equal(customerPrice, Math.round(25000 * 1.095));
});

test("resolveVariantPrice matches the exact existing 9.5% rounding used in seller.tsx today", () => {
  // seller.tsx: Math.round(Number(basePrice) * 1.095) — confirming no drift
  const { customerPrice } = resolveVariantPrice(undefined, 12345);
  assert.equal(customerPrice, Math.round(12345 * 1.095));
});

// ---------------------------------------------------------------------------
test("normalizeVariant reads the current {attributes:{...}} shape unchanged", () => {
  const n = normalizeVariant({ id: "a", attributes: { color: "Red" }, sku: "S1", stock: 4, price: 1000 });
  assert.deepEqual(n, { id: "a", attributes: { color: "Red" }, sku: "S1", stock: 4, price: 1000 });
});

test("normalizeVariant reads the legacy flat {color,size,shoeSize} shape", () => {
  const n = normalizeVariant({ id: "b", color: "Black", shoeSize: "42", stock: 2 });
  assert.deepEqual(n.attributes, { color: "Black", shoeSize: "42" });
  assert.equal(n.stock, 2);
});

test("normalizeVariant on legacy shape with no stock leaves stock undefined (doesn't invent 0 or 10)", () => {
  const n = normalizeVariant({ id: "c", color: "Pink", size: "M" });
  assert.equal(n.stock, undefined);
});

test("normalizeVariants on a non-array (null/undefined products.variants) returns an empty list safely", () => {
  assert.deepEqual(normalizeVariants(null), []);
  assert.deepEqual(normalizeVariants(undefined), []);
});

// ---------------------------------------------------------------------------
test("sameAttributes ignores key order", () => {
  assert.equal(
    sameAttributes({ color: "Red", size: "M" }, { size: "M", color: "Red" }),
    true
  );
});

test("sameAttributes is false when a value differs", () => {
  assert.equal(
    sameAttributes({ color: "Red" }, { color: "Blue" }),
    false
  );
});

test("suggestSku produces a readable, editable starting SKU", () => {
  const sku = suggestSku("SHOE", { color: "White", size: "38" });
  assert.equal(sku, "SHOE-WHITE-38");
});

console.log(`\n${passed} tests passed.`);

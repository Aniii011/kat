import { supabase } from "@/lib/supabase";
import { SUBCATEGORIES, TOP_CATEGORIES, CATEGORY_TO_TOP } from "@/data/listings";
import { THRIFT_ITEM_TYPES } from "@/lib/seller-categories";

// A product can have up to this many subcategories (e.g. "Polo Shirts" AND
// "Shirts"). The first one is the main one.
export const MAX_SUBCATEGORIES_PER_PRODUCT = 4;

// A seller-typed ("custom") subcategory is promoted to a ready-made option
// (in the seller form, and as a chip on Home) once this many products use it.
export const CUSTOM_SUBCATEGORY_PROMOTE_THRESHOLD = 3;

// Matching key: ignores case, punctuation and plural/singular, so "Bracelet",
// "bracelets" and "Bracelets " are all the same subcategory.
export function subKey(label: string): string {
  const k = label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (k.length <= 3) return k;
  if (k.endsWith("ies")) return k.slice(0, -3) + "y";
  if (/(sses|shes|ches|xes)$/.test(k)) return k.slice(0, -2);
  if (k.endsWith("ss")) return k;
  if (k.endsWith("s")) return k.slice(0, -1);
  return k;
}

const PRESET_KEYS: Set<string> = new Set(
  [...Object.values(SUBCATEGORIES).flat(), ...THRIFT_ITEM_TYPES].map(subKey)
);

export function isPresetSubcategory(label: string): boolean {
  return PRESET_KEYS.has(subKey(label));
}

function tidy(input: string): string {
  const cleaned = input.replace(/[^\p{L}\p{N}\s&'\-/.]/gu, "").replace(/\s+/g, " ").trim().slice(0, 30);
  // Only re-case if it was typed all-lowercase or ALL-CAPS; otherwise respect it.
  if (cleaned === cleaned.toLowerCase() || cleaned === cleaned.toUpperCase()) {
    return cleaned.split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(" ");
  }
  return cleaned;
}

/**
 * Cleans what a seller typed. If it is the same thing as an existing option
 * (ignoring case/plural), the existing option's exact label is returned, so
 * typing "dresses" never creates a second "Dresses".
 */
export function normalizeSubcategory(input: string, knownLabels: readonly string[] = []): string {
  const tidied = tidy(input);
  if (!tidied) return "";
  const k = subKey(tidied);
  const match = knownLabels.find((l) => subKey(l) === k);
  return match ?? tidied;
}

/** All subcategories on a product: the new array, or the old single value. */
export function getListingSubcategories(attributes: unknown): string[] {
  const a = (attributes ?? {}) as Record<string, unknown>;
  if (Array.isArray(a.subcategories)) {
    const subs = a.subcategories.filter((s): s is string => typeof s === "string" && s.trim() !== "");
    if (subs.length > 0) return subs;
  }
  return typeof a.subcategory === "string" && a.subcategory.trim() ? [a.subcategory] : [];
}

/** The top-level category a product belongs to ("Woman", "Shoes", "Thrift"...). */
export function topCategoryOf(category: string | undefined, isThrift?: boolean): string | undefined {
  if (isThrift) return "Thrift";
  if (!category) return undefined;
  if ((TOP_CATEGORIES as readonly string[]).includes(category)) return category;
  return CATEGORY_TO_TOP[category];
}

interface SubRow { top: string | undefined; subs: string[] }

/**
 * Custom (non-preset) subcategories used by at least `threshold` products,
 * most used first. Restricted to `tops` when given.
 */
export function popularCustomSubcategories(
  rows: SubRow[],
  tops?: string[],
  threshold: number = CUSTOM_SUBCATEGORY_PROMOTE_THRESHOLD,
  limit = 12
): string[] {
  const groups = new Map<string, { forms: Map<string, number>; total: number }>();
  for (const row of rows) {
    if (tops && tops.length > 0 && (!row.top || !tops.includes(row.top))) continue;
    const seen = new Set<string>();
    for (const sub of row.subs) {
      const k = subKey(sub);
      if (!k || PRESET_KEYS.has(k) || seen.has(k)) continue;
      seen.add(k); // a product counts once per subcategory
      const g = groups.get(k) ?? { forms: new Map(), total: 0 };
      g.total += 1;
      g.forms.set(sub, (g.forms.get(sub) ?? 0) + 1);
      groups.set(k, g);
    }
  }
  return [...groups.values()]
    .filter((g) => g.total >= threshold)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((g) => [...g.forms.entries()].sort((a, b) => b[1] - a[1])[0][0]);
}

// Seller-form suggestions: popular customs across live products. Cached for
// the page's lifetime so reopening the form doesn't refetch.
const suggestionCache = new Map<string, string[]>();

export async function fetchPopularCustomSubcategories(tops: string[]): Promise<string[]> {
  const cacheKey = [...tops].sort().join("|");
  const cached = suggestionCache.get(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("products")
    .select("category, is_thrift, attributes")
    .neq("status", "draft")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error || !data) return [];

  const rows: SubRow[] = data.map((r: any) => ({
    top: topCategoryOf(r.category, r.is_thrift),
    subs: getListingSubcategories(r.attributes),
  }));
  const result = popularCustomSubcategories(rows, tops);
  suggestionCache.set(cacheKey, result);
  return result;
}

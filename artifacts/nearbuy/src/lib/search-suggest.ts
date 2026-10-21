import { supabase } from "@/lib/supabase";
import { SUBCATEGORIES } from "@/data/listings";
import { THRIFT_ITEM_TYPES } from "@/lib/seller-categories";
import { getListingSubcategories, subKey } from "@/lib/subcategories";

// Typeahead for the search box: as soon as the buyer types a letter we offer
// likely things they mean ("ac" -> "Acrylic Nail", "Acrylic Nail Set"...),
// built from what is actually for sale on KAT, so every suggestion leads to
// results. Everything runs on the device after one small fetch.

interface Phrase { text: string; weight: number }
export interface SuggestVocab { phrases: Map<string, Phrase> }

// Words that can't start or end a suggestion on their own ("for", "with"...).
const EDGE_STOP = new Set(["for", "and", "with", "the", "of", "in", "a", "an", "to", "on", "by", "at", "from", "new", "size", "pcs", "pc"]);

function display(key: string): string {
  return key.split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

function addPhrase(map: Map<string, Phrase>, raw: string, weight: number) {
  const key = raw.toLowerCase().replace(/\s+/g, " ").trim();
  if (key.length < 2 || key.length > 40) return;
  const existing = map.get(key);
  if (existing) existing.weight += weight;
  else map.set(key, { text: display(key), weight });
}

function buildVocab(rows: { title: string | null; category: string | null; attributes: unknown }[]): SuggestVocab {
  const phrases = new Map<string, Phrase>();

  // Known labels, even before any product uses them.
  for (const label of [...Object.values(SUBCATEGORIES).flat(), ...THRIFT_ITEM_TYPES]) addPhrase(phrases, label, 3);

  for (const row of rows) {
    for (const sub of getListingSubcategories(row.attributes)) addPhrase(phrases, sub, 5);

    const words = (row.title ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9\s&'-]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    // Every 1-3 word run in the title is a candidate ("acrylic", "acrylic nail", "acrylic nail set").
    for (let i = 0; i < words.length; i++) {
      if (EDGE_STOP.has(words[i]) || /^\d+$/.test(words[i])) continue;
      for (let len = 1; len <= 3 && i + len <= words.length; len++) {
        const last = words[i + len - 1];
        if (EDGE_STOP.has(last)) continue;
        addPhrase(phrases, words.slice(i, i + len).join(" "), len === 1 ? 1 : 1.2);
      }
    }
  }
  return { phrases };
}

let vocabPromise: Promise<SuggestVocab> | null = null;

/** Loads (once per page load) the words buyers can search for. */
export function loadSuggestVocab(): Promise<SuggestVocab> {
  if (!vocabPromise) {
    vocabPromise = (async () => {
      const { data } = await supabase
        .from("products")
        .select("title, category, attributes")
        .neq("status", "draft")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1000);
      return buildVocab(data ?? []);
    })().catch(() => {
      vocabPromise = null; // allow a retry next time
      return buildVocab([]);
    });
  }
  return vocabPromise;
}

export interface Suggestion { text: string; key: string; prefix: boolean }

/**
 * Up to `limit` suggestions for what the buyer has typed so far. Works from
 * the first letter. Phrases that START with the typed text rank first, then
 * phrases where a later word starts with it ("nail" for "na"). Recent searches
 * and popular searches get a boost.
 */
export function getSuggestions(
  vocab: SuggestVocab | null,
  rawQuery: string,
  extras: { popular: string[]; recent: string[] },
  limit = 8
): Suggestion[] {
  const q = rawQuery.toLowerCase().replace(/\s+/g, " ").trim();
  if (!q) return [];

  const scored = new Map<string, { text: string; score: number; prefix: boolean }>();

  const consider = (key: string, text: string, weight: number, bonus: number) => {
    if (key === q) return;
    const prefix = key.startsWith(q);
    const wordStart = !prefix && (q.includes(" ") ? key.includes(" " + q) : key.split(" ").some((w) => w.startsWith(q)));
    if (!prefix && !wordStart) return;
    const score = (prefix ? 100 : 40) + Math.min(30, Math.log2(weight + 1) * 8) + bonus - key.length * 0.4;
    const dedupe = subKey(key);
    const existing = scored.get(dedupe);
    if (!existing || existing.score < score) scored.set(dedupe, { text, score, prefix });
  };

  if (vocab) for (const [key, p] of vocab.phrases) consider(key, p.text, p.weight, 0);
  for (const t of extras.recent) consider(t.toLowerCase().trim(), t.trim(), 1, 35);
  for (const t of extras.popular) consider(t.toLowerCase().trim(), display(t.toLowerCase().trim()), 1, 25);

  return [...scored.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([key, v]) => ({ text: v.text, key, prefix: v.prefix }));
}

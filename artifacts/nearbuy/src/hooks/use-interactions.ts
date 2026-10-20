import { supabase } from "@/lib/supabase";

export type InteractionEventType = "view" | "tap" | "search";

interface LogInteractionParams {
  // Optional: search events have no specific listing.
  listingId?: string;
  eventType: InteractionEventType;
  category?: string;
  subcategories?: string[];
  aesthetics?: string[];
  searchTerm?: string;
}

export interface AffinityScores {
  categoryScores: Record<string, number>;
  subcategoryScores: Record<string, number>;
  aestheticScores: Record<string, number>;
}

const EMPTY_AFFINITY: AffinityScores = { categoryScores: {}, subcategoryScores: {}, aestheticScores: {} };

// How many days back a signal takes to lose half its weight. Recent taps
// matter more than something from a month ago, but nothing is ever fully
// forgotten.
const HALF_LIFE_DAYS = 14;
const EVENT_WEIGHT: Record<InteractionEventType, number> = {
  tap: 3,
  search: 2,
  view: 1,
};

// ── Device-local interaction log ──
// Guests (not signed in) have no row in the `interactions` table, so their
// taps/views are kept on the device instead. This also carries subcategory,
// which the `interactions` table has no column for, for signed-in users too.
const LOCAL_KEY = "kat_local_interactions";
const LOCAL_MAX = 300;

interface LocalInteraction {
  ts: number;
  eventType: InteractionEventType;
  category?: string;
  subcategories?: string[];
  subcategory?: string; // older entries stored a single one
  aesthetics?: string[];
}

const subsOf = (row: LocalInteraction): string[] =>
  row.subcategories ?? (row.subcategory ? [row.subcategory] : []);

function loadLocal(): LocalInteraction[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendLocal(entry: LocalInteraction) {
  try {
    const next = [entry, ...loadLocal()].slice(0, LOCAL_MAX);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch {}
}

function weightOf(eventType: string, ts: number, now: number): number {
  const daysAgo = (now - ts) / 86400000;
  const recencyWeight = Math.pow(0.5, daysAgo / HALF_LIFE_DAYS);
  return recencyWeight * (EVENT_WEIGHT[eventType as InteractionEventType] ?? 1);
}

/**
 * Logs and reads a person's own product interactions, used to personalize
 * the Home feed. Signed-in users are stored in the `interactions` table (and
 * mirrored on the device for subcategory); guests are stored on the device
 * only, so a first-time visitor starts getting a personalized feed too.
 */
export function useInteractions(userId: string | null) {
  const logInteraction = async ({ listingId, eventType, category, subcategories, aesthetics, searchTerm }: LogInteractionParams) => {
    if (eventType !== "search" && !listingId) return;

    // Always remember it on this device (only events that carry a signal).
    if (category || (subcategories && subcategories.length > 0) || (aesthetics && aesthetics.length > 0)) {
      appendLocal({ ts: Date.now(), eventType, category, subcategories, aesthetics });
    }

    if (!userId) return;
    const { error } = await supabase.from("interactions").insert({
      user_id: userId,
      listing_id: listingId ?? null,
      event_type: eventType,
      category: category ?? null,
      aesthetics: aesthetics && aesthetics.length > 0 ? aesthetics : null,
      search_term: searchTerm ?? null,
    });
    // Never block the UI on this — a failed log shouldn't affect browsing.
    if (error) console.error("Failed to log interaction:", error);
  };

  const getAffinityScores = async (): Promise<AffinityScores> => {
    const now = Date.now();
    const categoryScores: Record<string, number> = {};
    const subcategoryScores: Record<string, number> = {};
    const aestheticScores: Record<string, number> = {};
    const local = loadLocal();

    if (userId) {
      // Signed in: category + aesthetic signals come from the account (so they
      // follow the person across devices); subcategory only exists locally.
      const { data, error } = await supabase
        .from("interactions")
        .select("event_type, category, aesthetics, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(300);

      if (!error && data) {
        for (const row of data) {
          const weight = weightOf(row.event_type, new Date(row.created_at).getTime(), now);
          if (row.category) categoryScores[row.category] = (categoryScores[row.category] ?? 0) + weight;
          for (const a of row.aesthetics ?? []) aestheticScores[a] = (aestheticScores[a] ?? 0) + weight;
        }
      }
      for (const row of local) {
        const w = weightOf(row.eventType, row.ts, now);
        for (const s of subsOf(row)) subcategoryScores[s] = (subcategoryScores[s] ?? 0) + w;
      }
      return { categoryScores, subcategoryScores, aestheticScores };
    }

    // Guest: everything comes from this device.
    for (const row of local) {
      const weight = weightOf(row.eventType, row.ts, now);
      if (row.category) categoryScores[row.category] = (categoryScores[row.category] ?? 0) + weight;
      for (const s of subsOf(row)) subcategoryScores[s] = (subcategoryScores[s] ?? 0) + weight;
      for (const a of row.aesthetics ?? []) aestheticScores[a] = (aestheticScores[a] ?? 0) + weight;
    }
    return local.length > 0 ? { categoryScores, subcategoryScores, aestheticScores } : EMPTY_AFFINITY;
  };

  return { logInteraction, getAffinityScores };
}

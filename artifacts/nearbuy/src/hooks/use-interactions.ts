import { supabase } from "@/lib/supabase";

export type InteractionEventType = "view" | "tap" | "search";

interface LogInteractionParams {
  // Optional: search events have no specific listing.
  listingId?: string;
  eventType: InteractionEventType;
  category?: string;
  aesthetics?: string[];
  searchTerm?: string;
}

export interface AffinityScores {
  categoryScores: Record<string, number>;
  aestheticScores: Record<string, number>;
}

const EMPTY_AFFINITY: AffinityScores = { categoryScores: {}, aestheticScores: {} };

// How many days back a signal takes to lose half its weight. Recent taps
// matter more than something from a month ago, but nothing is ever fully
// forgotten.
const HALF_LIFE_DAYS = 14;
const EVENT_WEIGHT: Record<InteractionEventType, number> = {
  tap: 3,
  search: 2,
  view: 1,
};

/**
 * Logs and reads a user's own product interactions, used to personalize
 * the Home feed. Guests (no userId) are intentionally no-ops — there's no
 * anonymous-id scheme yet, so unauthenticated browsing just keeps the
 * existing newest/featured ordering.
 */
export function useInteractions(userId: string | null) {
  const logInteraction = async ({ listingId, eventType, category, aesthetics, searchTerm }: LogInteractionParams) => {
    if (!userId) return;
    if (eventType !== "search" && !listingId) return;
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
    if (!userId) return EMPTY_AFFINITY;

    const { data, error } = await supabase
      .from("interactions")
      .select("event_type, category, aesthetics, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error || !data) return EMPTY_AFFINITY;

    const categoryScores: Record<string, number> = {};
    const aestheticScores: Record<string, number> = {};
    const now = Date.now();

    for (const row of data) {
      const daysAgo = (now - new Date(row.created_at).getTime()) / 86400000;
      const recencyWeight = Math.pow(0.5, daysAgo / HALF_LIFE_DAYS);
      const weight = recencyWeight * (EVENT_WEIGHT[row.event_type as InteractionEventType] ?? 1);

      if (row.category) {
        categoryScores[row.category] = (categoryScores[row.category] ?? 0) + weight;
      }
      for (const a of row.aesthetics ?? []) {
        aestheticScores[a] = (aestheticScores[a] ?? 0) + weight;
      }
    }

    return { categoryScores, aestheticScores };
  };

  return { logInteraction, getAffinityScores };
    }

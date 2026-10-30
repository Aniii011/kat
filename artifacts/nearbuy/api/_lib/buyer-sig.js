import { OPEN_STATUSES } from "./gift.js";

// "Send my gifts": the wishlist owner pays delivery for gifts that are waiting at KAT.
// The server decides everything here: who owns the list, which gifts are waiting, and the
// delivery fee (from the owner's saved area). The browser only names the wishlist.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (error) => ({ ok: false, error });

// Checks the list belongs to ownerId and works out the fee and the waiting gifts.
export async function loadSendGifts(sb, wishlistId, ownerId) {
  if (!UUID.test(String(wishlistId || ""))) return fail("This wishlist isn't valid.");

  const { data: wishlist, error: listError } = await sb
    .from("wishlists")
    .select("id, user_id, delivery_state, delivery_city")
    .eq("id", wishlistId)
    .maybeSingle();
  if (listError || !wishlist) return fail("This wishlist isn't available.");
  if (wishlist.user_id !== ownerId) return fail("This wishlist belongs to a different account.");

  const state = String(wishlist.delivery_state || "").trim();
  const city = String(wishlist.delivery_city || "").trim();
  if (!state || !city) return fail("Please add your delivery details to this wishlist first.");

  const { data: area, error: areaError } = await sb
    .from("delivery_areas")
    .select("delivery_fee, door_delivery_fee")
    .eq("state", state)
    .eq("city", city)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (areaError) return fail("Could not check delivery. Please try again.");
  if (!area) return fail("Delivery to your area isn't available.");

  const fee = area.delivery_fee ?? area.door_delivery_fee;
  if (fee === null || fee === undefined || !(Number(fee) > 0)) return fail("Delivery to your area isn't available.");

  const { data: waiting, error: waitingError } = await sb
    .from("orders")
    .select("id")
    .eq("wishlist_id", wishlistId)
    .eq("delivery_cleared", false)
    .in("admin_status", OPEN_STATUSES);
  if (waitingError) return fail("Could not load your gifts. Please try again.");

  return { ok: true, fee: Number(fee), waitingIds: (waiting || []).map((o) => o.id) };
}

// Called after Paystack says the delivery payment succeeded (browser path and webhook both
// use this). Each payment reference can only be used once, so an old payment can never be
// replayed to ship gifts that arrived later.
export async function settleSendGifts(sb, { reference, wishlistId, ownerId, amountKobo, currency }) {
  const loaded = await loadSendGifts(sb, wishlistId, ownerId);
  if (!loaded.ok) {
    console.error("send-gifts: cannot settle. Needs manual review.", { reference, reason: loaded.error });
    return { state: "review", message: loaded.error };
  }

  if (currency !== "NGN" || amountKobo !== loaded.fee * 100) {
    console.error("send-gifts: AMOUNT MISMATCH. Needs manual review.", { reference, paidKobo: amountKobo, expectedKobo: loaded.fee * 100 });
    return { state: "review", message: "The amount paid doesn't match the delivery fee." };
  }

  // Use this payment once.
  const { error: claimError } = await sb.from("processed_payments").insert({ payment_ref: reference });
  if (claimError) {
    const duplicate = claimError.code === "23505" || String(claimError.message || "").toLowerCase().includes("duplicate");
    if (duplicate) return { state: "already" };
    return { state: "error", message: "Could not record this payment." };
  }

  const { data: cleared, error: clearError } = await sb
    .from("orders")
    .update({ delivery_cleared: true })
    .eq("wishlist_id", wishlistId)
    .eq("delivery_cleared", false)
    .in("admin_status", OPEN_STATUSES)
    .select("id");

  if (clearError) {
    console.error("send-gifts: could not clear gifts", { reference, code: clearError.code });
    await sb.from("processed_payments").delete().eq("payment_ref", reference); // let a retry try again
    return { state: "error", message: "Could not send your gifts." };
  }

  if (!cleared || cleared.length === 0) {
    console.error("send-gifts: paid but nothing was waiting. Needs manual review.", { reference });
    return { state: "review", message: "Nothing was waiting when this payment arrived." };
  }

  return { state: "sent", count: cleared.length };
                                                                      }

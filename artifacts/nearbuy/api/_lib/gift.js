// Wishlist gifting, checked on the server.
//
// A gift order is a normal paid order with these differences:
//   * it ships to the wishlist owner's saved delivery details (never to an
//     address the browser supplies),
//   * the gifter pays for one OR SEVERAL items in a single checkout,
//   * delivery is priced from the owner's saved state/city (the gifter never picks
//     or sees a location), and paying it is OPTIONAL. Gifts wait at KAT until delivery
//     has been paid or requested, so everything for a person can go in ONE parcel, and
//   * once payment is confirmed the wishlist items are marked purchased.
//
// The browser only says WHICH wishlist items, WHO they are from, and whether this
// gifter wants to pay delivery. Everything else is read from the database here.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (error) => ({ ok: false, error });
const clip = (v, n) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, n);

export const MAX_GIFT_ITEMS = 10;
// Gift orders in these states are still at KAT, so a delivery payment can cover them.
export const OPEN_STATUSES = ["pending", "accepted", "preparing", "ready_for_pickup"];

// Nigerian numbers: 11 digits starting with 0, or 13 digits with country code.
export function isValidNigerianPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return /^0\d{10}$/.test(digits) || /^234\d{10}$/.test(digits);
}

// Accepts the new shape (wishlistItemIds: [...]) and the old single-item shape.
function giftItemIds(gift) {
  const raw = Array.isArray(gift?.wishlistItemIds) ? gift.wishlistItemIds : gift?.wishlistItemId ? [gift.wishlistItemId] : [];
  return [...new Set(raw.map((v) => String(v)))];
}

// Everything we must know about a gift BEFORE it is priced: whose list it is, where it
// goes, and whether delivery for the list is already covered.
//   afterPayment: the customer has already paid, so be forgiving. A paid gift is honoured
//   as long as the wishlist still exists, even if an item was removed or taken a moment ago.
export async function loadGiftContext(sb, intent, { afterPayment = false } = {}) {
  const gift = intent?.gift;
  if (!gift) return { ok: true, ctx: null };

  const ids = giftItemIds(gift);
  if (ids.length === 0 || ids.length > MAX_GIFT_ITEMS || ids.some((id) => !UUID.test(id))) {
    return fail("This gift link is no longer valid.");
  }
  const from = clip(gift.from, 60);
  if (!from) return fail("Please add your name so they know who the gift is from.");

  const { data: found, error: itemsError } = await sb
    .from("wishlist_items")
    .select("id, wishlist_id, product_id, is_purchased")
    .in("id", ids);
  if (itemsError) return fail("This gift is no longer available.");
  const items = found || [];

  let wishlistId = items[0]?.wishlist_id || null;
  if (items.some((i) => i.wishlist_id !== wishlistId)) return fail("These gifts are not all from the same wishlist.");
  if (!wishlistId && afterPayment && UUID.test(String(gift.wishlistId || ""))) wishlistId = String(gift.wishlistId);
  if (!wishlistId) return fail("This gift is no longer available.");

  if (!afterPayment) {
    if (items.length !== ids.length) return fail("One of these gifts is no longer on the list.");
    if (items.some((i) => i.is_purchased)) return fail("Someone has already gifted one of these items.");
  }

  const { data: wishlist, error: wishlistError } = await sb
    .from("wishlists")
    .select("delivery_name, delivery_phone, delivery_address, delivery_state, delivery_city, is_public")
    .eq("id", wishlistId)
    .maybeSingle();
  if (wishlistError || !wishlist) return fail("This wishlist is no longer available.");
  if (!afterPayment && !wishlist.is_public) return fail("This wishlist is no longer shared.");

  const address = clip(wishlist.delivery_address, 400);
  const state = clip(wishlist.delivery_state, 80);
  const city = clip(wishlist.delivery_city, 80);
  if (!address || !state || !city) {
    return fail("The owner hasn't finished adding their delivery details yet, so this list can't be gifted.");
  }

  // Is delivery for this list already covered by an earlier gift that hasn't left KAT yet?
  const { data: open } = await sb
    .from("orders")
    .select("id")
    .eq("wishlist_id", wishlistId)
    .eq("delivery_cleared", true)
    .in("admin_status", OPEN_STATUSES)
    .limit(1);
  const deliveryCovered = Boolean(open && open.length > 0);
  const includeDelivery = gift.includeDelivery === true;

  // Before payment only: don't charge for delivery that someone else just covered.
  if (!afterPayment && includeDelivery && deliveryCovered) {
    return fail("Delivery for this list was just paid by another gift. Please refresh and try again.");
  }

  return {
    ok: true,
    ctx: { ids, items, wishlistId, wishlist, address, state, city, from, includeDelivery, deliveryCovered },
  };
}

// Checks that what was priced is exactly the gifted items, and returns the details
// order creation needs. Call it after priceOrder.
//   requirePhone: false for the checkout PREVIEW (the gifter hasn't been asked for a phone yet).
export async function resolveGift(sb, intent, lines, { afterPayment = false, requirePhone = true } = {}) {
  const loaded = await loadGiftContext(sb, intent, { afterPayment });
  if (!loaded.ok) return loaded;
  if (!loaded.ctx) return { ok: true, gift: null };
  const { ctx } = loaded;

  // A gift order is exactly the gifted items, one of each, nothing else mixed in.
  if (!Array.isArray(lines) || lines.length === 0 || lines.some((l) => l.quantity !== 1)) {
    return fail("A gift order can only contain the gifted items.");
  }
  if (ctx.items.length === ctx.ids.length) {
    const wanted = ctx.items.map((i) => String(i.product_id)).sort();
    const got = lines.map((l) => String(l.item.listingId)).sort();
    if (wanted.length !== got.length || wanted.some((p, idx) => p !== got[idx])) {
      return fail("A gift order can only contain the gifted items.");
    }
  }

  // Use the owner's saved phone. If they never saved a usable one, accept the gifter's
  // entry (checked) so the courier still has a number to call.
  const phone = isValidNigerianPhone(ctx.wishlist.delivery_phone)
    ? clip(ctx.wishlist.delivery_phone, 30)
    : isValidNigerianPhone(intent.phone)
      ? clip(intent.phone, 30)
      : null;
  if (!phone && requirePhone) return fail("Please enter the recipient's phone number so the courier can reach them.");

  return {
    ok: true,
    gift: {
      itemIds: ctx.ids,
      items: ctx.items,
      wishlistId: ctx.wishlistId,
      from: ctx.from,
      includeDelivery: ctx.includeDelivery,
      deliveryCovered: ctx.deliveryCovered,
      state: ctx.state,
      city: ctx.city,
      recipient: { name: clip(ctx.wishlist.delivery_name, 120), phone, address: ctx.address },
    },
  };
}

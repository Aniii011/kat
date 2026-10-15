// Wishlist gifting, checked on the server.
//
// A gift order is a normal paid order with two differences:
//   * it ships to the wishlist owner's saved delivery details (never to an
//     address the browser supplies), and
//   * once Paystack confirms payment, the wishlist item is marked purchased.
//
// The browser only says WHICH wishlist item and WHO it is from; everything else
// is read from the database here.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (error) => ({ ok: false, error });
const clip = (v, n) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, n);

// Nigerian numbers: 11 digits starting with 0, or 13 digits with country code.
export function isValidNigerianPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return /^0\d{10}$/.test(digits) || /^234\d{10}$/.test(digits);
}

export async function resolveGift(sb, intent, lines) {
  const gift = intent?.gift;
  if (!gift) return { ok: true, gift: null };

  const itemId = String(gift.wishlistItemId || "");
  if (!UUID.test(itemId)) return fail("This gift link is no longer valid.");

  const from = clip(gift.from, 60);
  if (!from) return fail("Please add your name so they know who the gift is from.");

  const { data: item, error: itemError } = await sb
    .from("wishlist_items")
    .select("id, wishlist_id, product_id, is_purchased")
    .eq("id", itemId)
    .maybeSingle();
  if (itemError || !item) return fail("This gift is no longer available.");
  if (item.is_purchased) return fail("Someone has already gifted this item.");

  const { data: wishlist, error: wishlistError } = await sb
    .from("wishlists")
    .select("delivery_name, delivery_phone, delivery_address, is_public")
    .eq("id", item.wishlist_id)
    .maybeSingle();
  if (wishlistError || !wishlist || !wishlist.is_public) return fail("This wishlist is no longer shared.");

  const address = clip(wishlist.delivery_address, 400);
  if (!address) return fail("The owner hasn't added a delivery address to this wishlist yet.");

  // A gift order is exactly one of the gifted item, nothing else mixed in.
  if (
    !Array.isArray(lines) ||
    lines.length !== 1 ||
    String(lines[0].item.listingId) !== String(item.product_id) ||
    lines[0].quantity !== 1
  ) {
    return fail("A gift order can only contain the gifted item.");
  }

  // Use the owner's saved phone. If they never saved a usable one, accept the
  // buyer's entry (checked) so the courier still has a number to call.
  const phone = isValidNigerianPhone(wishlist.delivery_phone)
    ? clip(wishlist.delivery_phone, 30)
    : isValidNigerianPhone(intent.phone)
      ? clip(intent.phone, 30)
      : null;
  if (!phone) return fail("Please enter the recipient's phone number so the courier can reach them.");

  return {
    ok: true,
    gift: {
      itemId,
      from,
      recipient: { name: clip(wishlist.delivery_name, 120), phone, address },
    },
  };
                       }

import crypto from "crypto";
import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { getAuthedUser } from "./_lib/auth.js";
import { priceOrder } from "./_lib/pricing.js";
import { loadGiftContext, resolveGift } from "./_lib/gift.js";

// Called by checkout just BEFORE the Paystack popup opens. It returns the
// authoritative total (worked out from database prices) and an unguessable
// payment reference. Checkout charges exactly this amount, so the amount the
// buyer pays and the amount the server later verifies can't disagree.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ ok: false, error: "Please sign in to continue." });

  try {
    const orderIntent = req.body?.orderIntent;
    // "preview" is how the gift checkout shows the delivery line and total before it asks
    // for anything else (such as the recipient's phone).
    const preview = req.body?.preview === true;

    // Gift orders: find the wishlist, where it goes, and whether delivery is already covered.
    const loaded = await loadGiftContext(supabaseAdmin, orderIntent);
    if (!loaded.ok) return res.status(400).json({ ok: false, error: loaded.error });
    const giftCtx = loaded.ctx;

    const priced = await priceOrder(
      supabaseAdmin,
      giftCtx ? { ...orderIntent, state: giftCtx.state, city: giftCtx.city } : orderIntent,
      { checkStock: true, giftContext: giftCtx ? { state: giftCtx.state, city: giftCtx.city, includeDelivery: giftCtx.includeDelivery } : undefined },
    );
    if (!priced.ok) return res.status(400).json({ ok: false, error: priced.error });

    // ...and make sure the wishlist items are exactly what was priced, still available.
    const giftCheck = await resolveGift(supabaseAdmin, orderIntent, priced.lines, { requirePhone: !preview });
    if (!giftCheck.ok) return res.status(400).json({ ok: false, error: giftCheck.error });

    return res.status(200).json({
      ok: true,
      reference: `KAT-${crypto.randomUUID()}`,
      subtotal: priced.subtotal,
      delivery: priced.delivery,
      // Gifts only: what delivery costs, and whether an earlier gift already covered it.
      deliveryFee: giftCtx ? priced.deliveryFee : null,
      deliveryCovered: giftCtx ? giftCtx.deliveryCovered : false,
      discount: priced.discount,
      total: priced.total,
      amountKobo: priced.total * 100,
      items: priced.lines.map((l) => ({
        listingId: l.item.listingId,
        selectedColor: l.item.selectedColor || null,
        selectedSize: l.item.selectedSize || null,
        unitPrice: l.unitPrice,
      })),
    });
  } catch (error) {
    console.error("quote error", error?.message);
    return res.status(500).json({ ok: false, error: "Could not confirm your order total. Please try again." });
  }
}

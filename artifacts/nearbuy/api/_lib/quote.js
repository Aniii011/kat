import crypto from "crypto";
import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { getAuthedUser } from "./_lib/auth.js";
import { priceOrder } from "./_lib/pricing.js";

// Called by checkout just BEFORE the Paystack popup opens. It returns the
// authoritative total (worked out from database prices) and an unguessable
// payment reference. Checkout charges exactly this amount, so the amount the
// buyer pays and the amount the server later verifies can't disagree.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ ok: false, error: "Please sign in to continue." });

  try {
    const priced = await priceOrder(supabaseAdmin, req.body?.orderIntent);
    if (!priced.ok) return res.status(400).json({ ok: false, error: priced.error });

    return res.status(200).json({
      ok: true,
      reference: `KAT-${crypto.randomUUID()}`,
      subtotal: priced.subtotal,
      delivery: priced.delivery,
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

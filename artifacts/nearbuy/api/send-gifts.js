import crypto from "crypto";
import { getAuthedUser } from "./_lib/auth.js";
import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { loadSendGifts } from "./_lib/send-gifts.js";
import { signBuyer } from "./_lib/buyer-sig.js";

// Called by "My gifts" just BEFORE the Paystack popup opens, when the owner taps "Send my gifts".
// It returns the delivery fee to charge (worked out here from the database) and a payment
// reference signed for this signed-in owner.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ ok: false, error: "Please sign in to continue." });

  try {
    const wishlistId = req.body?.wishlistId;
    const loaded = await loadSendGifts(supabaseAdmin, wishlistId, user.id);
    if (!loaded.ok) return res.status(400).json({ ok: false, error: loaded.error });

    if (loaded.waitingIds.length === 0) {
      return res.status(400).json({ ok: false, error: "None of your gifts are waiting at KAT right now." });
    }

    const reference = `KAT-${crypto.randomUUID()}`;
    return res.status(200).json({
      ok: true,
      reference,
      buyerSig: signBuyer(reference, user.id),
      deliveryFee: loaded.fee,
      amountKobo: loaded.fee * 100,
      count: loaded.waitingIds.length,
    });
  } catch (err) {
    console.error("send-gifts quote failed", err?.message);
    return res.status(500).json({ ok: false, error: "We couldn't prepare your delivery. Please try again." });
  }
}

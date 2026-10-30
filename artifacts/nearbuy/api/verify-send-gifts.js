import { getAuthedUser } from "./_lib/auth.js";
import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { settleSendGifts } from "./_lib/send-gifts.js";
import { buyerSigMatches } from "./_lib/buyer-sig.js";

const SUPPORT_NOTE = "Please contact KAT support and quote this payment reference";

// Browser path for "Send my gifts": confirms with Paystack that the delivery payment
// succeeded, then marks the owner's waiting gifts as ready to ship.
// (paystack-webhook.js does the same if the browser never makes it back.)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ verified: false, error: "Method not allowed" });

  const user = await getAuthedUser(req, { allowBanned: true }); // a paid delivery is always completed
  if (!user) return res.status(401).json({ verified: false, error: "Please sign in to continue." });

  const { reference } = req.body || {};
  if (typeof reference !== "string" || !/^KAT-[A-Za-z0-9-]{8,80}$/.test(reference)) {
    return res.status(400).json({ verified: false, error: "Payment reference is invalid." });
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } },
    );
    const data = await response.json();
    const transaction = data?.data;

    const paid =
      Boolean(data?.status) &&
      transaction?.status === "success" &&
      transaction?.reference === reference &&
      transaction?.currency === "NGN";
    if (!paid) return res.status(200).json({ verified: false, reason: "Payment verification failed." });

    const wishlistId = transaction?.metadata?.sendGifts?.wishlistId;
    if (!wishlistId || !buyerSigMatches(reference, user.id, transaction?.metadata?.buyerSig)) {
      console.error("verify-send-gifts: payment is not a valid delivery payment for this user", { reference });
      return res.status(403).json({ verified: false, error: "This payment belongs to a different account." });
    }

    const result = await settleSendGifts(supabaseAdmin, {
      reference,
      wishlistId,
      ownerId: user.id,
      amountKobo: transaction.amount,
      currency: transaction.currency,
    });

    if (result.state === "sent") return res.status(200).json({ verified: true, sent: true, count: result.count });
    if (result.state === "already") return res.status(200).json({ verified: true, alreadySent: true });
    if (result.state === "review") {
      return res.status(409).json({ verified: false, error: `We received your payment but couldn't send your gifts yet. ${SUPPORT_NOTE}: ${reference}` });
    }
    return res.status(500).json({ verified: false, error: `We received your payment but couldn't finish. ${SUPPORT_NOTE}: ${reference}` });
  } catch (err) {
    console.error("verify-send-gifts error", err?.message);
    return res.status(500).json({ verified: false, error: "Payment verification failed. Please try again." });
  }
}

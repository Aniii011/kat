import crypto from "crypto";
import { getAuthedUser } from "./_lib/auth.js";
import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { loadSendGifts, settleSendGifts } from "./_lib/send-gifts.js";
import { signBuyer, buyerSigMatches } from "./_lib/buyer-sig.js";
import { OPEN_STATUSES } from "./_lib/gift.js";

// All the "gifts" endpoints in ONE serverless function (Vercel's Hobby plan allows max 12).
//   GET  /api/gifts?action=list    -> gifts friends bought from my wishlists   (was /api/my-gifts)
//   POST /api/gifts?action=send    -> delivery fee + signed reference           (was /api/send-gifts)
//   POST /api/gifts?action=verify  -> confirm delivery payment, release gifts   (was /api/verify-send-gifts)

const SUPPORT_NOTE = "Please contact KAT support and quote this payment reference";

// ---- list ----
// Lists the gifts friends have bought from the signed-in person's own wishlists.
// The gift orders belong to the friends' accounts, so the owner can't read them
// directly. This reads them with the server key, but only for wishlists the
// signed-in user owns, and returns just what the owner needs to see:
// what it is, who it is from, and where it is. No friend email, phone or payment info.
async function listGifts(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ ok: false, error: "Please sign in to continue." });

  try {
    const { data: lists, error: listsError } = await supabaseAdmin
      .from("wishlists")
      .select("id, name, emoji")
      .eq("user_id", user.id);
    if (listsError) throw listsError;
    if (!lists || lists.length === 0) return res.status(200).json({ ok: true, gifts: [] });

    const names = Object.fromEntries(lists.map((l) => [l.id, l]));

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, wishlist_id, product_title, product_image, variant, delivery_cleared, admin_status, created_at")
      .in("wishlist_id", lists.map((l) => l.id))
      .order("created_at", { ascending: false });
    if (ordersError) throw ordersError;

    const gifts = (orders || []).map((o) => {
      const status = o.admin_status || "pending";
      let state;
      if (status === "cancelled") state = "cancelled";
      else if (status === "delivered") state = "delivered";
      else if (status === "out_for_delivery") state = "on_the_way";
      else if (OPEN_STATUSES.includes(status)) state = o.delivery_cleared ? "on_the_way" : "waiting";
      else state = o.delivery_cleared ? "on_the_way" : "waiting";

      return {
        id: o.id,
        wishlistId: o.wishlist_id,
        wishlistName: names[o.wishlist_id]?.name || "Wishlist",
        wishlistEmoji: names[o.wishlist_id]?.emoji || "🎁",
        title: o.product_title || "Gift",
        image: o.product_image || null,
        from: o.variant?.gift?.from || null,
        state,
        createdAt: o.created_at,
      };
    });

    return res.status(200).json({ ok: true, gifts });
  } catch (err) {
    console.error("my-gifts failed", err?.code || err?.message);
    return res.status(500).json({ ok: false, error: "We couldn't load your gifts. Please try again." });
  }
        }

// ---- send ----
// Called by "My gifts" just BEFORE the Paystack popup opens, when the owner taps "Send my gifts".
// It returns the delivery fee to charge (worked out here from the database) and a payment
// reference signed for this signed-in owner.
async function sendQuote(req, res) {
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

// ---- verify ----
// Browser path for "Send my gifts": confirms with Paystack that the delivery payment
// succeeded, then marks the owner's waiting gifts as ready to ship.
// (paystack-webhook.js does the same if the browser never makes it back.)
async function verifySend(req, res) {
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

export default async function handler(req, res) {
  const action = req.query?.action;
  if (action === "list") return listGifts(req, res);
  if (action === "send") return sendQuote(req, res);
  if (action === "verify") return verifySend(req, res);
  return res.status(404).json({ ok: false, error: "Not found" });
      }

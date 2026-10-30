import crypto from "crypto";
import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { priceOrder } from "./_lib/pricing.js";
import { fulfillOrder } from "./_lib/fulfill.js";
import { loadGiftContext, resolveGift } from "./_lib/gift.js";
import { buyerSigMatches } from "./_lib/buyer-sig.js";
import { settleSendGifts } from "./_lib/send-gifts.js";

// Paystack signs the EXACT bytes it sends, so we need the raw body to check the
// signature. Re-serialising parsed JSON can produce different bytes and fail.
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  let raw = Buffer.concat(chunks);
  // Fallback if the platform already parsed the body before we could read it.
  if (raw.length === 0 && req.body) {
    raw = Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
  }
  return raw;
}

function signatureMatches(rawBody, signature) {
  if (typeof signature !== "string" || !signature) return false;
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Register https://<your-domain>/api/paystack-webhook in the Paystack dashboard
// (Settings > API Keys & Webhooks). This only needs to catch payments whose
// browser never made it back to /api/verify-payment.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rawBody = await readRawBody(req);

  if (!signatureMatches(rawBody, req.headers["x-paystack-signature"])) {
    console.error("PAYSTACK WEBHOOK: signature mismatch, rejecting.");
    return res.status(401).json({ error: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid body" });
  }

  if (event.event !== "charge.success") return res.status(200).json({ received: true });

  const { reference, amount, currency, metadata } = event.data || {};
  const intent = metadata?.orderIntent;

  // "Send my gifts": the owner paid delivery for gifts waiting at KAT (no items in this payment).
  if (metadata?.sendGifts) {
    const sendGifts = metadata.sendGifts;
    if (typeof reference !== "string" || !buyerSigMatches(reference, sendGifts.buyerId, metadata?.buyerSig)) {
      console.error("PAYSTACK WEBHOOK: delivery payment signature missing or invalid. Needs manual review.", { reference });
      return res.status(200).json({ received: true, note: "Needs manual review." });
    }
    try {
      const result = await settleSendGifts(supabaseAdmin, {
        reference,
        wishlistId: sendGifts.wishlistId,
        ownerId: sendGifts.buyerId,
        amountKobo: amount,
        currency,
      });
      if (result.state === "error") return res.status(500).json({ error: "Delivery reconciliation failed", reference });
      return res.status(200).json({ received: true, state: result.state });
    } catch (err) {
      console.error("PAYSTACK WEBHOOK ERROR (send gifts)", err?.message);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }

  if (typeof reference !== "string" || !intent || typeof intent.buyerId !== "string") {
    console.error("PAYSTACK WEBHOOK: charge.success without usable order details", { reference });
    return res.status(200).json({ received: true, note: "Cannot reconcile." });
  }

  // The buyer in the metadata came from the browser, so only trust it if the server signed it.
  if (!buyerSigMatches(reference, intent.buyerId, metadata?.buyerSig)) {
    console.error("PAYSTACK WEBHOOK: buyer signature missing or invalid. Needs manual review.", { reference });
    return res.status(200).json({ received: true, note: "Needs manual review." });
  }

  try {
    // Already handled by the browser path? Nothing to do.
    const { data: existing } = await supabaseAdmin.from("orders").select("id").eq("payment_ref", reference).limit(1);
    if (existing && existing.length > 0) return res.status(200).json({ received: true, note: "Already processed." });

    // Same rule as the browser path: the order is priced from the database and
    // the amount actually paid has to match it.
    const loadedGift = await loadGiftContext(supabaseAdmin, intent, { afterPayment: true });
    if (!loadedGift.ok) {
      console.error("PAYSTACK WEBHOOK: gift problem. Needs manual review.", { reference, reason: loadedGift.error });
      return res.status(200).json({ received: true, note: "Needs manual review." });
    }
    const giftCtx = loadedGift.ctx;
    const priced = await priceOrder(
      supabaseAdmin,
      giftCtx ? { ...intent, state: giftCtx.state, city: giftCtx.city } : intent,
      { giftContext: giftCtx ? { state: giftCtx.state, city: giftCtx.city, includeDelivery: giftCtx.includeDelivery } : undefined },
    );
    if (!priced.ok || currency !== "NGN" || amount !== priced.total * 100) {
      console.error("PAYSTACK WEBHOOK: payment does not match a valid order. Needs manual review.", {
        reference,
        paidKobo: amount,
        expectedKobo: priced.ok ? priced.total * 100 : null,
        reason: priced.ok ? "amount" : priced.error,
      });
      return res.status(200).json({ received: true, note: "Needs manual review." });
    }

    const giftCheck = await resolveGift(supabaseAdmin, intent, priced.lines, { afterPayment: true });
    if (!giftCheck.ok) {
      console.error("PAYSTACK WEBHOOK: gift problem. Needs manual review.", { reference, reason: giftCheck.error });
      return res.status(200).json({ received: true, note: "Needs manual review." });
    }

    const result = await fulfillOrder(supabaseAdmin, {
      reference,
      intent,
      priced,
      buyerId: intent.buyerId,
      eventStatus: "accepted",
      gift: giftCheck.gift,
    });

    if (result.state === "error") return res.status(500).json({ error: "Order reconciliation failed", reference });
    return res.status(200).json({ received: true, state: result.state });
  } catch (err) {
    console.error("PAYSTACK WEBHOOK ERROR", err?.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
      }

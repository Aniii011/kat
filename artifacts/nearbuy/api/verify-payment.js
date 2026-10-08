import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { getAuthedUser } from "./_lib/auth.js";
import { priceOrder } from "./_lib/pricing.js";
import { fulfillOrder } from "./_lib/fulfill.js";

const SUPPORT_NOTE = "Please contact KAT support and quote this payment reference";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ verified: false, error: "Method not allowed" });
  }

  // 1. Who is asking? The buyer comes from the verified login token, never from the request body.
  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ verified: false, error: "Please sign in to continue." });

  const { reference, orderIntent } = req.body || {};

  if (typeof reference !== "string" || !/^KAT-[A-Za-z0-9-]{8,80}$/.test(reference)) {
    return res.status(400).json({ verified: false, error: "Payment reference is invalid." });
  }
  if (!orderIntent || !Array.isArray(orderIntent.items)) {
    return res.status(400).json({ verified: false, error: "Order information is missing." });
  }

  try {
    // 2. Ask Paystack whether this payment really succeeded.
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const data = await response.json();
    const transaction = data?.data;

    const paid =
      Boolean(data?.status) &&
      transaction?.status === "success" &&
      transaction?.reference === reference &&
      transaction?.currency === "NGN";

    if (!paid) {
      return res.status(200).json({ verified: false, reason: "Payment verification failed." });
    }

    // 3. The payment must belong to this signed-in buyer.
    if (transaction?.metadata?.orderIntent?.buyerId !== user.id) {
      console.error("verify-payment: buyer mismatch", { reference });
      return res.status(403).json({ verified: false, error: "This payment belongs to a different account." });
    }

    // 4. Already turned into orders (retry, or the webhook got there first)? Return them.
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id, buyer_id")
      .eq("payment_ref", reference);

    if (existing && existing.length > 0) {
      if (existing[0].buyer_id !== user.id) {
        return res.status(403).json({ verified: false, error: "This payment belongs to a different account." });
      }
      return res.status(200).json({
        verified: true,
        alreadyCreated: true,
        orderIds: existing.map((o) => o.id),
      });
    }

    // 5. Work out what the order SHOULD cost from the database, and require the
    //    amount Paystack actually collected to match it exactly.
    const priced = await priceOrder(supabaseAdmin, orderIntent);
    if (!priced.ok) {
      console.error("verify-payment: could not price order", { reference, reason: priced.error });
      return res.status(409).json({
        verified: false,
        error: `We received your payment but couldn't confirm your order. ${SUPPORT_NOTE}: ${reference}`,
      });
    }

    if (transaction.amount !== priced.total * 100) {
      console.error("verify-payment: AMOUNT MISMATCH", {
        reference,
        paidKobo: transaction.amount,
        expectedKobo: priced.total * 100,
      });
      return res.status(409).json({
        verified: false,
        error: `The amount paid doesn't match your order total. ${SUPPORT_NOTE}: ${reference}`,
      });
    }

    // 6. Create the orders.
    const result = await fulfillOrder(supabaseAdmin, {
      reference,
      intent: orderIntent,
      priced,
      buyerId: user.id,
      eventStatus: "pending",
      eventNote: "Order placed successfully.",
    });

    if (result.state === "processing") {
      return res.status(200).json({ verified: true, processing: true });
    }
    if (result.state === "already") {
      return res.status(200).json({ verified: true, alreadyCreated: true, orderIds: result.orderIds });
    }
    if (result.state === "created") {
      return res.status(200).json({ verified: true, created: true, orderIds: result.orderIds });
    }
    return res.status(500).json({ verified: false, error: result.message });
  } catch (error) {
    console.error("verify-payment error", error?.message);
    return res.status(500).json({ verified: false, error: "Payment verification failed. Please try again." });
  }
        }

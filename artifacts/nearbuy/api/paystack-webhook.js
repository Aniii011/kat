import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service role key — this file runs
// only on Vercel's server, the service role key is never sent to a browser.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Register this endpoint's URL (https://<your-domain>/api/paystack-webhook)
// in the Paystack dashboard under Settings > API Keys & Webhooks. This is a
// manual step that has to happen in Paystack's dashboard — it can't be done
// from here.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Paystack signs every webhook body with your secret key so you can trust
  // it actually came from Paystack and wasn't forged. Reject anything that
  // doesn't match before doing anything else.
  const signature = req.headers["x-paystack-signature"];
  const expectedSignature = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (signature !== expectedSignature) {
    console.error("PAYSTACK WEBHOOK: signature mismatch — rejecting.");
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = req.body;

  if (event.event !== "charge.success") {
    // Not an event this reconciliation path cares about — acknowledge and
    // exit so Paystack doesn't keep retrying delivery of it.
    return res.status(200).json({ received: true });
  }

  const { reference, amount, metadata } = event.data || {};

  if (!reference || !metadata?.orderIntent) {
    console.error("PAYSTACK WEBHOOK: charge.success missing reference or order intent metadata.", { reference });
    return res.status(200).json({ received: true, note: "No order intent metadata — cannot reconcile." });
  }

  try {
    // Same claim pattern as the client path: try to claim this payment_ref.
    // If it's already claimed, the client-side flow already handled this
    // transaction successfully — nothing to do here, and importantly, this
    // guarantees the webhook can NEVER create a second, duplicate set of
    // orders for a transaction the client already processed.
    const { error: claimError } = await supabase
      .from("processed_payments")
      .insert({ payment_ref: reference });

    if (claimError) {
      // Unique violation means someone else (the client, or an earlier
      // webhook delivery) already claimed this reference. Safe no-op.
      return res.status(200).json({ received: true, note: "Already processed." });
    }

    const orderIntent = metadata.orderIntent;
    // orderIntent shape, set by Checkout at Paystack init time:
    // { items: CheckoutItem[], fullName, phone, address, state, city,
    //   deliveryFee, couponCode, discount, buyerId }

    const productLookups = await Promise.all(
      orderIntent.items.map((item) =>
        supabase.from("products").select("seller_id, store_id").eq("id", item.listingId).single()
      )
    );

    const rows = orderIntent.items.map((item, i) => ({
      product_id: item.listingId,
      buyer_id: orderIntent.buyerId || null,
      buyer_name: orderIntent.fullName,
      buyer_phone: orderIntent.phone,
      buyer_address: orderIntent.address,
      delivery_state: orderIntent.state,
      delivery_area: orderIntent.city,
      delivery_fee: orderIntent.deliveryFee,
      amount: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      variant: { color: item.selectedColor || null, size: item.selectedSize || null },
      coupon_code: orderIntent.couponCode || null,
      discount_amount: orderIntent.discount || 0,
      status: "pending",
      seller_status: "pending",
      admin_status: "pending",
      seller_id: productLookups[i].data?.seller_id || null,
      store_id: productLookups[i].data?.store_id || null,
      payment_ref: reference,
    }));

    const { data: insertedOrders, error: insertError } = await supabase
      .from("orders")
      .insert(rows)
      .select();

    if (insertError) {
      // This is the actual failure case item 3 asked about: payment
      // succeeded, but even the webhook's own order creation failed. At this
      // point automated recovery has been attempted and failed — this needs
      // a human. Log loudly so it surfaces in monitoring/alerts rather than
      // vanishing into a 200 response.
      console.error("PAYSTACK WEBHOOK: order creation failed after successful payment.", {
        reference,
        error: insertError.message,
      });
      // Release the claim so a subsequent manual retry or webhook redelivery
      // isn't permanently blocked by this failed attempt.
      await supabase.from("processed_payments").delete().eq("payment_ref", reference);
      return res.status(500).json({ error: "Order reconciliation failed", reference });
    }

    await supabase.from("order_events").insert(
      insertedOrders.map((o) => ({ order_id: o.id, status: "pending" }))
    );

    console.log("PAYSTACK WEBHOOK: reconciled order(s) for payment that the client never confirmed.", {
      reference,
      orderIds: insertedOrders.map((o) => o.id),
    });

    return res.status(200).json({ received: true, reconciled: true, orderIds: insertedOrders.map((o) => o.id) });

  } catch (err) {
    console.error("PAYSTACK WEBHOOK ERROR:", err);
    return res.status(500).json({ error: err.message || "Webhook processing failed" });
  }
  }

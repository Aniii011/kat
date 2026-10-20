import { sendOrderEmail } from "./order-email.js";
import { reserveStockForOrders } from "./stock.js";

// Creates the order rows for a verified payment. Shared by verify-payment.js
// (browser callback) and paystack-webhook.js (reconciliation), so both build
// orders the same way and can never create duplicates for one payment.

async function releaseClaim(sb, reference) {
  await sb.from("processed_payments").delete().eq("payment_ref", reference);
}

export async function fulfillOrder(sb, { reference, intent, priced, buyerId, eventStatus = "pending", eventNote, gift = null }) {
  // Already fulfilled?
  const { data: existing, error: existingError } = await sb
    .from("orders")
    .select("id, buyer_id")
    .eq("payment_ref", reference);

  if (existingError) return { state: "error", message: "Could not check existing order." };
  if (existing && existing.length > 0) {
    return { state: "already", orderIds: existing.map((o) => o.id), buyerId: existing[0].buyer_id };
  }

  // Claim this payment so a second request can't win the race
  const { error: claimError } = await sb.from("processed_payments").insert({ payment_ref: reference });

  if (claimError) {
    const duplicate =
      claimError.code === "23505" || String(claimError.message || "").toLowerCase().includes("duplicate");
    if (!duplicate) return { state: "error", message: "Could not reserve payment for order creation." };

    const { data: retry } = await sb.from("orders").select("id, buyer_id").eq("payment_ref", reference);
    if (retry && retry.length > 0) {
      return { state: "already", orderIds: retry.map((o) => o.id), buyerId: retry[0].buyer_id };
    }
    return { state: "processing" };
  }

  const rows = priced.lines.map(({ item, product, unitPrice, quantity }) => ({
    product_id: item.listingId,
    product_title: product.title || item.title || "Product",
    product_image: product.image_url || item.imageUrl || null,
    product_seller_name: product.seller_name || item.sellerName || null,

    buyer_id: buyerId,
    // Gift orders ship to the wishlist owner's saved details, not to anything the browser sent.
    buyer_name: (gift ? gift.recipient.name : String(intent.fullName || "").slice(0, 120)) || null,
    buyer_address: (gift ? gift.recipient.address : String(intent.address || "").slice(0, 400)) || null,
    buyer_phone: (gift ? gift.recipient.phone : String(intent.phone || "").slice(0, 30)) || null,

    delivery_area: intent.city || null,
    delivery_state: intent.state || null,
    delivery_fee: priced.delivery,

    amount: unitPrice,
    quantity,
    total: unitPrice * quantity,

    variant: {
      color: item.selectedColor || null,
      size: item.selectedSize || null,
      ...(gift ? { gift: { from: gift.from, wishlist_item_id: gift.itemId } } : {}),
    },

    coupon_code: priced.coupon ? priced.coupon.code : null,
    discount_amount: priced.discount,

    status: "pending",
    seller_status: "pending",
    admin_status: "accepted",
    assigned_to_seller: Boolean(product.seller_id),

    seller_id: product.seller_id || null,
    store_id: product.store_id || null,

    payment_ref: reference,
  }));

  const { data: created, error: insertError } = await sb.from("orders").insert(rows).select("id, product_id, quantity, variant");

  if (insertError || !created) {
    console.error("Order creation failed", { reference, code: insertError?.code });
    await releaseClaim(sb, reference); // let a retry or webhook redelivery try again
    return { state: "error", message: "Payment verified but order creation failed." };
  }

  const { error: eventsError } = await sb
    .from("order_events")
    .insert(created.map((o) => ({ order_id: o.id, status: eventStatus, note: eventNote })));
  if (eventsError) console.error("Order events creation failed", { reference }); // orders exist: never re-run

  // Gift: mark the wishlist item purchased now that payment is confirmed and the order exists.
  // The "is_purchased = false" condition means two gifters can never overwrite each other.
  if (gift) {
    const { data: marked, error: giftError } = await sb
      .from("wishlist_items")
      .update({ is_purchased: true, purchased_by_name: gift.from })
      .eq("id", gift.itemId)
      .eq("is_purchased", false)
      .select("id");
    if (giftError || !marked || marked.length === 0) {
      console.error("Gift item was not marked purchased", { reference });
    }
  }

  // Count the coupon use on the server (the browser no longer touches coupons)
  if (priced.coupon) {
    await sb
      .from("coupons")
      .update({ times_used: (priced.coupon.times_used || 0) + 1 })
      .eq("id", priced.coupon.id);
  }

  // Take the stock in one safe database step. A paid order is never refused here; if the unit
  // was already gone it is flagged for the team instead (see _lib/stock.js).
  try {
    await reserveStockForOrders(sb, created);
  } catch (e) {
    console.error("Stock step failed", { reference });
  }

  // "Order confirmed" email. Only the request that actually CREATED the orders gets here,
  // and the email log also guarantees one send per payment. A failure here is recorded
  // but must never undo or fail an order that has already been paid and created.
  try {
    await sendOrderEmail(sb, { paymentRef: reference, kind: "placed", timeoutMs: 4000 });
  } catch (e) {
    console.error("Confirmation email step failed", { reference });
  }

  return { state: "created", orderIds: created.map((o) => o.id) };
}

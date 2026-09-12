import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      verified: false,
      error: "Method not allowed",
    });
  }

  const { reference, expectedAmount, orderIntent } = req.body || {};

  console.log("verify-payment request body:", JSON.stringify(req.body));

  if (!reference) {
    console.error("verify-payment 400: missing reference");
    return res.status(400).json({
      verified: false,
      error: "Payment reference is required.",
    });
  }

  if (
    typeof expectedAmount !== "number" ||
    !Number.isFinite(expectedAmount) ||
    expectedAmount <= 0
  ) {
    console.error("verify-payment 400: invalid expectedAmount", expectedAmount);
    return res.status(400).json({
      verified: false,
      error: "Invalid expected amount.",
    });
  }

  if (!orderIntent || !Array.isArray(orderIntent.items)) {
    console.error("verify-payment 400: missing/invalid orderIntent.items", orderIntent);
    return res.status(400).json({
      verified: false,
      error: "Order information is missing.",
    });
  }

  // buyerId lives nested in orderIntent — this is the exact same shape
  // already attached as Paystack metadata at transaction init time (see
  // checkout.tsx), which paystack-webhook.js also reads from. Keeping one
  // single orderIntent shape everywhere means the client path and the
  // webhook reconciliation path can never silently drift apart.
  const buyerId = orderIntent.buyerId;

  if (!buyerId) {
    console.error("verify-payment 400: missing buyerId on orderIntent", orderIntent);
    return res.status(400).json({
      verified: false,
      error: "Buyer information is missing.",
    });
  }

  try {
    /*
     * 1. Verify the transaction directly with Paystack.
     */
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    console.log("Paystack verify:", {
      reference,
      apiStatus: data.status,
      transactionStatus: data.data?.status,
      amount: data.data?.amount,
      currency: data.data?.currency,
    });

    const transaction = data.data;

    const verified =
      Boolean(data.status) &&
      transaction?.status === "success" &&
      transaction?.reference === reference &&
      transaction?.currency === "NGN" &&
      transaction?.amount === expectedAmount;

    if (!verified) {
      return res.status(200).json({
        verified: false,
        reason: "Payment verification failed.",
        payment: transaction || null,
      });
    }

    /*
     * 2. Check whether this payment already created orders.
     *
     * This is important because both the browser callback and
     * Paystack webhook can reach the fulfillment logic.
     */
    const { data: existingOrders, error: existingOrdersError } =
      await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("payment_ref", reference)
        .limit(1);

    if (existingOrdersError) {
      console.error(
        "Existing order lookup failed:",
        existingOrdersError
      );

      return res.status(500).json({
        verified: false,
        error: "Could not check existing order.",
      });
    }

    if (existingOrders && existingOrders.length > 0) {
      return res.status(200).json({
        verified: true,
        alreadyCreated: true,
        orderIds: existingOrders.map((order) => order.id),
        payment: transaction,
      });
    }

    /*
     * 3. Prevent another fulfillment request from winning the race.
     *
     * IMPORTANT:
     * The browser no longer touches processed_payments.
     * This happens with the service-role client on the server.
     */
    const { error: claimError } = await supabaseAdmin
      .from("processed_payments")
      .insert({
        payment_ref: reference,
      });

    if (claimError) {
      /*
       * A duplicate key means another fulfillment path already
       * claimed this payment. We do NOT treat every database
       * error as a duplicate.
       */
      const duplicate =
        claimError.code === "23505" ||
        String(claimError.message || "")
          .toLowerCase()
          .includes("duplicate");

      if (duplicate) {
        const { data: retryOrders } = await supabaseAdmin
          .from("orders")
          .select("id")
          .eq("payment_ref", reference);

        if (retryOrders && retryOrders.length > 0) {
          return res.status(200).json({
            verified: true,
            alreadyCreated: true,
            orderIds: retryOrders.map((order) => order.id),
            payment: transaction,
          });
        }

        /*
         * Another process may currently be creating the order.
         * Tell the browser to wait rather than charging again.
         */
        return res.status(200).json({
          verified: true,
          processing: true,
          payment: transaction,
        });
      }

      console.error(
        "processed_payments claim failed:",
        claimError
      );

      return res.status(500).json({
        verified: false,
        error: "Could not reserve payment for order creation.",
      });
    }

    /*
     * 4. Fetch the real product/seller information from Supabase.
     *
     * We do not trust product pricing or seller information
     * supplied by the browser.
     */
    const listingIds = orderIntent.items
      .map((item) => item.listingId)
      .filter(Boolean);

    if (listingIds.length !== orderIntent.items.length) {
      console.error("verify-payment 400: item missing listingId", orderIntent.items);
      await supabaseAdmin
        .from("processed_payments")
        .delete()
        .eq("payment_ref", reference);

      return res.status(400).json({
        verified: false,
        error: "One or more products are missing.",
      });
    }

    const { data: products, error: productsError } =
      await supabaseAdmin
        .from("products")
        .select(
          "id, seller_id, store_id, seller_name, title, image_url"
        )
        .in("id", listingIds);

    if (productsError) {
      console.error("Product lookup failed:", productsError);

      await supabaseAdmin
        .from("processed_payments")
        .delete()
        .eq("payment_ref", reference);

      return res.status(500).json({
        verified: false,
        error: "Could not load products.",
      });
    }

    const productMap = new Map(
      (products || []).map((product) => [product.id, product])
    );

    /*
     * 5. Build order rows.
     *
     * Keep the same order shape your current Checkout uses.
     */
    const rows = [];

    for (const item of orderIntent.items) {
      const product = productMap.get(item.listingId);

      if (!product) {
        console.error("verify-payment 400: product not found", item.listingId, "known ids:", Array.from(productMap.keys()));
        await supabaseAdmin
          .from("processed_payments")
          .delete()
          .eq("payment_ref", reference);

        return res.status(400).json({
          verified: false,
          error: `Product ${item.listingId} could not be found.`,
        });
      }

      rows.push({
        product_id: item.listingId,
        product_title: product.title || item.title || "Product",
        product_image: product.image_url || item.imageUrl || null,
        product_seller_name:
          product.seller_name || item.sellerName || null,

        buyer_id: buyerId,

        // Real orderIntent field names — must match exactly what
        // checkout.tsx attaches as Paystack metadata (fullName, discount),
        // since paystack-webhook.js reads that same metadata shape for its
        // own reconciliation path. A mismatch here would silently corrupt
        // orders created via one path but not the other.
        buyer_name: orderIntent.fullName || null,
        buyer_address: orderIntent.address || null,
        buyer_phone: orderIntent.phone || null,

        delivery_area: orderIntent.city || null,
        delivery_state: orderIntent.state || null,
        delivery_fee: Number(orderIntent.deliveryFee || 0),

        amount: Number(item.price || 0),
        quantity: Number(item.quantity || 1),

        total:
          Number(item.price || 0) *
          Number(item.quantity || 1),

        variant: {
          color: item.selectedColor || null,
          size: item.selectedSize || null,
        },

        coupon_code: orderIntent.couponCode || null,
        discount_amount: Number(orderIntent.discount || 0),

        status: "pending",
        seller_status: "pending",
        admin_status: "accepted",
        assigned_to_seller: Boolean(product.seller_id),

        seller_id: product.seller_id || null,
        store_id: product.store_id || null,

        payment_ref: reference,
      });
    }

    /*
     * 6. Create the orders.
     */
    const { data: createdOrders, error: ordersError } =
      await supabaseAdmin
        .from("orders")
        .insert(rows)
        .select("id, payment_ref");

    if (ordersError || !createdOrders) {
      console.error("Order creation failed:", ordersError);

      /*
       * Release the idempotency claim so the webhook can retry.
       */
      await supabaseAdmin
        .from("processed_payments")
        .delete()
        .eq("payment_ref", reference);

      return res.status(500).json({
        verified: false,
        error: "Payment verified but order creation failed.",
      });
    }

    /*
     * 7. Create order events.
     */
    const events = createdOrders.map((order) => ({
      order_id: order.id,
      status: "pending",
      note: "Order placed successfully.",
    }));

    const { error: eventsError } = await supabaseAdmin
      .from("order_events")
      .insert(events);

    if (eventsError) {
      console.error("Order events creation failed:", eventsError);

      /*
       * Do NOT delete processed_payments here.
       *
       * The orders already exist. Re-running fulfillment would
       * risk duplicate orders.
       */
    }

    console.log("Order fulfillment successful:", {
      reference,
      orderIds: createdOrders.map((order) => order.id),
    });

    return res.status(200).json({
      verified: true,
      created: true,
      orderIds: createdOrders.map((order) => order.id),
      payment: transaction,
    });
  } catch (error) {
    console.error("verify-payment error:", error);

    return res.status(500).json({
      verified: false,
      error:
        error instanceof Error
          ? error.message
          : "Payment verification failed.",
    });
  }
        }

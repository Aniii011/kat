import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, MapPin, ShoppingBag, Lock, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { NIGERIAN_STATES } from "@/lib/nigeriaStates";

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

const FREE_DELIVERY_THRESHOLD = 25000;

// Turns whatever a failed order-creation / verification attempt throws into
// language a buyer can actually act on. Never shown: Postgres/Supabase error
// text, JS stack messages, or raw Paystack payloads.
function friendlyOrderError(err: any): string {
  const raw = String(err?.message || err || "").toLowerCase();
  if (raw.includes("failed to fetch") || raw.includes("network")) {
    return "Something went wrong while processing your order. Please check your connection and try again.";
  }
  if (raw.includes("unexpected number of rows")) {
    return "We couldn't confirm your full order. Please contact support with your payment reference before trying again.";
  }
  return "Something went wrong while placing your order. Please try again, or contact support if you were charged.";
}

function friendlyPaystackError(err: any): string {
  return "Your payment wasn't completed. Please try again.";
}

interface CheckoutItem {
  listingId: string;
  title: string;
  price: number;
  imageUrl: string;
  sellerName: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export default function Checkout() {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [, navigate] = useLocation();

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [fullName, setFullName] = useState(user?.name || localStorage.getItem("kat_name") || "");
  const [phone, setPhone] = useState(localStorage.getItem("kat_phone") || "");
  const [address, setAddress] = useState(localStorage.getItem("kat_address") || "");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [cities, setCities] = useState<any[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("kat_checkout_items");
    if (stored) {
      try { setItems(JSON.parse(stored)); }
      catch { navigate("/cart"); }
    } else {
      navigate("/cart");
    }
  }, []);

  useEffect(() => {
    if (!state) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      const { data } = await supabase
        .from("delivery_areas")
        .select("*")
        .eq("state", state)
        .eq("active", true)
        .order("city");

      if (data) setCities(data);
    };

    fetchCities();
  }, [state]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const citySelected = !!city;
  // Don't claim delivery is "Free" before we actually know the fee for the chosen area.
  const delivery = citySelected ? (subtotal >= 25000 ? 0 : deliveryFee) : 0;

  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const freeDeliveryUnlocked = subtotal >= FREE_DELIVERY_THRESHOLD;

  const discount = appliedCoupon
    ? appliedCoupon.discount_type === "percent"
      ? Math.round(subtotal * (appliedCoupon.discount_value / 100))
      : Math.min(appliedCoupon.discount_value, subtotal)
    : 0;

  const total = subtotal + delivery - discount;

  const phoneDigits = phone.trim().replace(/\D/g, "");
  // Nigerian numbers: 11 digits starting with 0 (e.g. 08012345678),
  // or 13 digits with country code (e.g. 2348012345678).
  const isValidPhone = /^0\d{10}$/.test(phoneDigits) || /^234\d{10}$/.test(phoneDigits);

  const canPlaceOrder =
    fullName.trim().length > 0 &&
    isValidPhone &&
    address.trim().length > 0 &&
    !!state &&
    !!city;

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setApplyingCoupon(true);
    setCouponError("");

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .single();

    if (error || !data) {
      setCouponError("Invalid or expired coupon code.");
      setAppliedCoupon(null);
      setApplyingCoupon(false);
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCouponError("This coupon has expired.");
      setAppliedCoupon(null);
      setApplyingCoupon(false);
      return;
    }

    if (data.usage_limit && data.times_used >= data.usage_limit) {
      setCouponError("This coupon has reached its usage limit.");
      setAppliedCoupon(null);
      setApplyingCoupon(false);
      return;
    }

    if (data.min_order_amount && subtotal < data.min_order_amount) {
      setCouponError(`This code requires a minimum order of ${formatNaira(data.min_order_amount)}.`);
      setAppliedCoupon(null);
      setApplyingCoupon(false);
      return;
    }

    setAppliedCoupon(data);
    setApplyingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  // Builds the buyer-facing confirmation payload from a set of already-persisted
  // order rows. Shared by both the normal success path and the duplicate-callback
  // recovery path below, so the confirmation screen behaves identically either way.
  const buildConfirmationPayload = (orderIds: string[], reference: string) => ({
    orderIds,
    items,
    total,
    delivery,
    fullName: fullName.trim(),
    phone: phone.trim(),
    address: `${address.trim()}, ${city.trim()}`,
    paymentRef: reference,
    createdAt: new Date().toISOString(),
  });

  const handleSuccessfulPayment = async (response: any) => {
    try {
      const expectedAmountKobo = total * 100;

      const verify = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: response.reference,
          // FIX: server-side verification now independently confirms the
          // amount Paystack actually collected matches what Checkout
          // expected — without this, verification only proved "a successful
          // charge exists for this reference," not "for the right amount."
          expectedAmount: expectedAmountKobo,
        }),
      });

      const result = await verify.json();

      if (!result.verified) {
        setError("Your payment wasn't completed. Please try again.");
        setPlacing(false);
        return;
      }

      // ── Idempotency claim ──
      // FIX: previously this did a SELECT to check for an existing order,
      // then an INSERT — two separate round-trips with a real race window
      // between them. A `processed_payments` table with payment_ref as its
      // PRIMARY KEY makes this atomic: only one caller can ever successfully
      // claim a given reference, so two near-simultaneous callback firings
      // (or a client callback racing the server-side reconciliation webhook)
      // cannot both proceed to create orders.
      const { error: claimError } = await supabase
        .from("processed_payments")
        .insert({ payment_ref: response.reference });

      if (claimError) {
        // Someone else already claimed this reference — either a duplicate
        // callback on this same client, or the reconciliation webhook beat
        // us to it. Either way, orders already exist (or are being created)
        // for this payment. Look them up and route to confirmation instead
        // of silently stopping, so the buyer never gets stuck.
        const { data: existingOrders } = await supabase
          .from("orders")
          .select("id")
          .eq("payment_ref", response.reference);

        const orderIds = (existingOrders || []).map((o) => o.id);
        sessionStorage.setItem(
          "kat_order_confirmed",
          JSON.stringify(buildConfirmationPayload(orderIds, response.reference))
        );
        sessionStorage.removeItem("kat_checkout_items");
        clearCart();
        setPlacing(false);
        navigate("/order-confirmation");
        return;
      }

      // ── Order creation ──
      // FIX: previously this looped over `items` doing one INSERT per item, with
      // `if (error) throw` breaking the loop on first failure. That meant a cart
      // of 3 items could end up with item #1 charged-and-inserted, then items
      // #2-#3 never created if the 2nd insert failed for any reason — the buyer
      // is charged for 3 items but only 1 gets an order. A single batched
      // `.insert([...])` call is one Postgres statement: either every line item
      // is created, or none are (a genuine insert-level failure rolls back the
      // whole statement rather than leaving a partial set of rows behind).
      const productLookups = await Promise.all(
        items.map((item) =>
          supabase.from("products").select("seller_id, store_id").eq("id", item.listingId).single()
        )
      );

      const rows = items.map((item, i) => ({
        product_id: item.listingId,
        buyer_id: user?.id || null,
        buyer_name: fullName.trim(),
        buyer_phone: phone.trim(),
        buyer_address: address.trim(),
        delivery_state: state,
        delivery_area: city,
        delivery_fee: delivery,
        amount: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        variant: { color: item.selectedColor || null, size: item.selectedSize || null },
        coupon_code: appliedCoupon?.code || null,
        discount_amount: discount,
        status: "pending",
        seller_status: "pending",
        admin_status: "pending",
        seller_id: productLookups[i].data?.seller_id || null,
        store_id: productLookups[i].data?.store_id || null,
        payment_ref: response.reference,
      }));

      const { data: insertedOrders, error: insertError } = await supabase
        .from("orders")
        .insert(rows)
        .select();

      if (insertError) throw insertError;
      if (!insertedOrders || insertedOrders.length !== items.length) {
        // Defensive check: if the insert reports success but didn't return the
        // expected number of rows, don't silently proceed as if everything is
        // fine — surface it rather than confirming an order that may be short.
        throw new Error("Order creation returned an unexpected number of rows. Please contact support before retrying payment.");
      }

      const orderIds = insertedOrders.map((o) => o.id);
      await supabase.from("order_events").insert(
        insertedOrders.map((o) => ({ order_id: o.id, status: "pending" }))
      );

      if (appliedCoupon) {
        await supabase
          .from("coupons")
          .update({ times_used: (appliedCoupon.times_used || 0) + 1 })
          .eq("id", appliedCoupon.id);
      }

      sessionStorage.setItem(
        "kat_order_confirmed",
        JSON.stringify(buildConfirmationPayload(orderIds, response.reference))
      );

      sessionStorage.removeItem("kat_checkout_items");
      clearCart();

      setPlacing(false);
      navigate("/order-confirmation");

    } catch (err: any) {
      console.error("ORDER ERROR:", err);
      // NOTE: if this fires AFTER a successful Paystack charge (verify.verified
      // was true) but the order insert itself failed, the buyer has been
      // charged with no order on file. That combination is now structurally
      // prevented by the batched insert above for the "some rows fail" case,
      // but a total insert failure (e.g. network drop after payment) can still
      // occur. This is the one remaining gap that genuinely needs either a
      // server-side reconciliation job (matching Paystack transactions against
      // `orders.payment_ref` and alerting on orphans) or a webhook-based
      // fallback order-creation path — both are backend work outside what a
      // client-side fix can guarantee.
      setError(friendlyOrderError(err));
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder) return;

    setPlacing(true);
    setError("");

    const PaystackPop = (window as any).PaystackPop;

    if (!PaystackPop) {
      setError("Paystack failed to load.");
      setPlacing(false);
      return;
    }

    try {
      // Paystack Popup v2 API — the script tag in index.html must be
      // https://js.paystack.co/v2/inline.js for this to work.
      const popup = new PaystackPop();
      popup.newTransaction({
        key: "pk_test_f4a152b1348a3c6f5c4b415f3341691ea02b2e2c",
        email: user?.email || "customer@kat.ng",
        amount: total * 100,
        currency: "NGN",
        reference: `KAT-${Date.now()}`,
        // FIX: attach the full order intent as Paystack metadata. Paystack
        // echoes metadata back on both the client success callback AND the
        // server-side webhook event. If the browser tab closes, loses
        // network, or the client-side insert fails entirely right after a
        // successful charge, the webhook (paystack-webhook.js) can still
        // reconstruct the exact same orders from this metadata — a
        // successful payment can no longer permanently disappear just
        // because the client never made it back to finish the job.
        metadata: {
          orderIntent: {
            items,
            fullName: fullName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            state,
            city,
            deliveryFee: delivery,
            couponCode: appliedCoupon?.code || null,
            discount,
            buyerId: user?.id || null,
          },
        },
        onSuccess: (response: any) => {
          handleSuccessfulPayment(response);
        },
        onCancel: () => {
          setError("Payment cancelled. Your order hasn't been placed.");
          setPlacing(false);
        },
        onError: (err: any) => {
          console.error("PAYSTACK ERROR:", err);
          setError(friendlyPaystackError(err));
          setPlacing(false);
        },
      });

    } catch (err: any) {
      console.error("ORDER ERROR FULL:", err);
      setError(friendlyOrderError(err));
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  const errorBlock = error && (
    <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
      <p className="text-xs text-destructive font-medium">{error}</p>
    </div>
  );

  const payCta = (
    <Button
      className="w-full rounded-full font-bold h-12 text-sm"
      disabled={!canPlaceOrder || placing}
      onClick={handlePlaceOrder}
    >
      {placing ? "Processing payment…" : `Pay ${formatNaira(total)}`}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-12">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full" aria-label="Back to cart">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-base font-black">Checkout</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 md:py-8 grid md:grid-cols-[1fr_360px] gap-4 md:gap-6 items-start">

        {/* LEFT: delivery + payment */}
        <div className="space-y-4 min-w-0">
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Delivery Address
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" placeholder="e.g. Anike Johnson" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl h-11" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" placeholder="e.g. 08012345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-11" type="tel" inputMode="tel" />
              {phone.trim().length === 0 && (
                <p className="text-xs text-muted-foreground">Please enter a phone number.</p>
              )}
              {phone.trim().length > 0 && !isValidPhone && (
                <p className="text-xs text-destructive">Please enter a valid phone number (e.g. 08012345678).</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Delivery address</Label>
              <Input id="address" placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl h-11" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setCity("");
                    setDeliveryFee(0);
                  }}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city">Delivery area</Label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCity(value);
                    const selected = cities.find((c) => c.city === value);
                    setDeliveryFee(selected?.delivery_fee || 0);
                  }}
                  disabled={!state}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">
                    {state ? "Select area" : "Select state first"}
                  </option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.city}>
                      {c.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold flex items-center gap-2">
              🏷️ Coupon Code
            </p>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">{appliedCoupon.code}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    {appliedCoupon.discount_type === "percent" ? `${appliedCoupon.discount_value}% off applied` : `${formatNaira(appliedCoupon.discount_value)} off applied`}
                  </p>
                </div>
                <button onClick={removeCoupon} className="text-xs font-semibold text-muted-foreground underline">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="rounded-xl h-11 font-mono flex-1"
                  aria-label="Coupon code"
                />
                <Button variant="outline" className="rounded-xl h-11" onClick={applyCoupon} disabled={applyingCoupon || !couponInput.trim()}>
                  {applyingCoupon ? "..." : "Apply"}
                </Button>
              </div>
            )}
            {couponError && <p className="text-xs text-destructive font-medium">{couponError}</p>}
          </div>

          <p className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground px-1">
            <Lock className="w-3.5 h-3.5" /> Payment is secured by Paystack. Your card details are encrypted and never stored on KAT.
          </p>

          <div className="hidden md:block">{errorBlock}</div>
        </div>

        {/* RIGHT: order summary, sticky on desktop */}
        <div className="md:sticky md:top-[76px] space-y-4">
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" /> Order Items ({items.length})
            </p>
            {items.map((item, i) => (
              <div key={i} className="flex gap-3 items-center">
                <img src={item.imageUrl} alt={item.title} className="w-14 h-14 rounded-xl object-contain shrink-0 bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-2">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[item.selectedColor, item.selectedSize].filter(Boolean).join(" / ")} · Qty {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-bold text-primary shrink-0">{formatNaira(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatNaira(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount ({appliedCoupon.code})</span>
                <span className="font-medium text-emerald-600">-{formatNaira(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              {!citySelected ? (
                <span className="font-medium text-muted-foreground">Select delivery area</span>
              ) : (
                <span className={`font-medium ${delivery === 0 ? "text-emerald-600" : ""}`}>
                  {delivery === 0 ? "Free delivery" : formatNaira(delivery)}
                </span>
              )}
            </div>

            {!freeDeliveryUnlocked && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" /> Add {formatNaira(amountToFreeDelivery)} more to unlock free delivery.
              </p>
            )}
            {freeDeliveryUnlocked && (
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                🎉 Free delivery unlocked
              </p>
            )}

            <Separator />
            <div className="flex justify-between font-black text-base">
              <span>Total</span>
              <span className="text-primary">{formatNaira(total)}</span>
            </div>
            {discount > 0 && (
              <p className="text-xs text-emerald-600 font-semibold text-right">You saved {formatNaira(discount)} 🎉</p>
            )}
          </div>

          <p className="md:hidden flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center px-4">
            <Lock className="w-3 h-3" /> Payment is secured by Paystack. Your card details are encrypted and never stored on KAT.
          </p>

          <div className="md:hidden">{errorBlock}</div>

          {/* Desktop CTA sits inline with the sticky summary */}
          <div className="hidden md:block space-y-2">
            {!canPlaceOrder && (
              <p className="text-xs text-center text-muted-foreground">
                Fill in your name, phone, address, state and delivery area to continue
              </p>
            )}
            {payCta}
          </div>
        </div>
      </main>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-30 md:hidden">
        <div className="max-w-5xl mx-auto space-y-2">
          {!canPlaceOrder && (
            <p className="text-xs text-center text-muted-foreground">
              Fill in your name, phone, address, state and delivery area to continue
            </p>
          )}
          {payCta}
        </div>
      </div>
    </div>
  );
        }

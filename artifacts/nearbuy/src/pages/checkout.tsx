import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/lib/supabase";
import { SUPPORT_EMAIL } from "@/lib/support";
import {
  ArrowLeft, MapPin, ShoppingBag, Lock,
} from "lucide-react";
import { Tag, Gift, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { NIGERIAN_STATES } from "@/lib/nigeriaStates";

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

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
  // Set when this checkout started from someone's wishlist (see pages/wishlist-view.tsx).
  const [gift, setGift] = useState<null | {
    wishlistId: string;
    wishlistItemIds: string[];
    productIds: string[];
    from: string;
    // First name only. The recipient's phone and street address stay on the server.
    recipient: { name: string; needsPhone?: boolean };
  }>(null);
  // Gifts only: does THIS gifter also want to pay delivery (optional), and what the server says
  // the gift costs. The browser never works out a gift's delivery fee or total itself.
  const [giftPayDelivery, setGiftPayDelivery] = useState(false);
  const [giftPreview, setGiftPreview] = useState<null | { subtotal: number; delivery: number; deliveryFee: number; deliveryCovered: boolean; discount: number; total: number }>(null);
  const [giftPreviewError, setGiftPreviewError] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  // Separate from deliveryFee: whether standard/park delivery is even
  // offered for the chosen area at all. Some areas are doorstep-only —
  // this is what tells us that, since deliveryFee alone can't (0 could
  // mean "free standard delivery" or "not offered").
  const [standardAvailable, setStandardAvailable] = useState(true);
  const [doorDeliveryFee, setDoorDeliveryFee] = useState<number | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "door">("standard");
  const [deliveryNote, setDeliveryNote] = useState<string | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [placing, setPlacing] = useState(false);
  // Paystack's inline SDK can fire onSuccess more than once for the same
  // transaction on flaky connections. Two concurrent runs of the payment
  // handler racing each other risks one run's real error getting silently
  // overwritten by the other's generic fallback message. This guard makes
  // only the FIRST callback do any work; every later firing for the same
  // popup instance is a no-op.
  const paymentHandledRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("kat_checkout_items");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed);

        // A gift checkout only applies to exactly the gifted items. If the buyer wandered off
        // and came back through the cart, drop the stale gift.
        const rawGift = sessionStorage.getItem("kat_gift_checkout");
        if (rawGift) {
          try {
            const g = JSON.parse(rawGift);
            const wishlistItemIds: string[] = Array.isArray(g.wishlistItemIds) ? g.wishlistItemIds : g.wishlistItemId ? [g.wishlistItemId] : [];
            const productIds: string[] = Array.isArray(g.productIds) ? g.productIds : g.productId ? [g.productId] : [];
            const matches =
              Array.isArray(parsed) &&
              parsed.length > 0 &&
              parsed.length === productIds.length &&
              wishlistItemIds.length === productIds.length &&
              parsed.every((p: any) => productIds.includes(p.listingId) && Number(p.quantity) === 1);
            if (matches) {
              setGift({ wishlistId: g.wishlistId || "", wishlistItemIds, productIds, from: g.from, recipient: g.recipient || { name: "" } });
              // The gifter never sees the recipient's phone or address. The server
              // reads the real ones from the wishlist when the order is created.
              setFullName(g.recipient?.name || "");
              setPhone("");
              setAddress("");
            } else {
              sessionStorage.removeItem("kat_gift_checkout");
            }
          } catch {
            sessionStorage.removeItem("kat_gift_checkout");
          }
        }
      }
      catch { navigate("/cart"); }
    } else {
      sessionStorage.removeItem("kat_gift_checkout");
      navigate("/cart");
    }
  }, []);

  // Pre-fill delivery details from the buyer's saved address (Me page / last order),
  // like other marketplaces do. They can still change any of it. Skipped for gift
  // checkouts, where the address belongs to the recipient and is never shown.
  useEffect(() => {
    if (!user?.id || sessionStorage.getItem("kat_gift_checkout")) return undefined;
    let cancelled = false;
    (async () => {
      // If the saved-address columns don't exist yet this returns an error and we
      // simply skip pre-filling.
      const { data } = await supabase
        .from("profiles")
        .select("address, delivery_state, delivery_city")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      if (data.address) {
        setAddress((cur) => cur || data.address);
        if (!localStorage.getItem("kat_address")) localStorage.setItem("kat_address", data.address);
      }
      if (data.delivery_state && NIGERIAN_STATES.includes(data.delivery_state)) {
        setState((cur) => cur || data.delivery_state);
        if (data.delivery_city) setCity((cur) => cur || data.delivery_city);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

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
  // Delivery is always the selected city's fee — no subtotal-based free delivery.
  const delivery = gift
    ? (giftPreview?.delivery ?? 0)
    : citySelected
      ? (deliveryMethod === "door" && doorDeliveryFee !== null ? doorDeliveryFee : deliveryFee)
      : 0;

  const discount = gift
    ? (giftPreview?.discount ?? 0)
    : appliedCoupon
      ? appliedCoupon.discount_type === "percent"
        ? Math.round(subtotal * (appliedCoupon.discount_value / 100))
        : Math.min(appliedCoupon.discount_value, subtotal)
      : 0;

  const total = gift && giftPreview ? giftPreview.total : subtotal + delivery - discount;

  const phoneDigits = phone.trim().replace(/\D/g, "");
  // Nigerian numbers: 11 digits starting with 0 (e.g. 08012345678),
  // or 13 digits with country code (e.g. 2348012345678).
  const isValidPhone = /^0\d{10}$/.test(phoneDigits) || /^234\d{10}$/.test(phoneDigits);

  // For a gift the server supplies the recipient's name and address. A phone is
  // only asked for when the recipient has no usable phone saved on their wishlist.
  const giftNeedsPhone = !!gift && !!gift.recipient?.needsPhone;
  const canPlaceOrder = gift
    ? (!giftNeedsPhone || isValidPhone) && !!giftPreview && !giftPreviewError
    : fullName.trim().length > 0 &&
      isValidPhone &&
      address.trim().length > 0 &&
      !!state &&
      !!city;

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setApplyingCoupon(true);
    setCouponError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setCouponError("Please sign in to use a coupon.");
        setAppliedCoupon(null);
        setApplyingCoupon(false);
        return;
      }

      // Checked on the server so coupon codes can't be listed from the browser.
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, subtotal }),
      });
      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.ok) {
        setCouponError(result?.error || "Couldn't check that coupon. Please try again.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(result.coupon);
      }
    } catch {
      setCouponError("Couldn't check that coupon. Please try again.");
      setAppliedCoupon(null);
    }
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
    // For a gift, nothing about the recipient is stored in the gifter's browser.
    fullName: gift ? (user?.name || "") : fullName.trim(),
    phone: gift ? "" : phone.trim(),
    address: gift ? "" : `${address.trim()}, ${city.trim()}`,
    gift: gift ? { for: gift.recipient?.name || "" } : null,
    paymentRef: reference,
    createdAt: new Date().toISOString(),
  });

  // What is being bought and where it goes. Prices are NOT trusted: the server
  // re-prices everything from the database (see /api/quote and /api/verify-payment).
  const makeOrderIntent = () => ({
    items,
    fullName: fullName.trim(),
    phone: phone.trim(),
    address: address.trim(),
    // A gift is delivered to the owner's saved area, decided by the server. Nothing here can change it.
    state: gift ? "" : state,
    city: gift ? "" : city,
    deliveryFee: gift ? 0 : delivery,
    couponCode: appliedCoupon?.code || null,
    buyerId: user?.id || null,
    gift: gift
      ? { wishlistId: gift.wishlistId, wishlistItemIds: gift.wishlistItemIds, from: gift.from, includeDelivery: giftPayDelivery }
      : null,
  });

  // Gifts: ask the server what this gift costs (items, the optional delivery, the total)
  // whenever something that affects it changes. This is how the delivery line is shown without
  // the gifter ever knowing the recipient's location.
  useEffect(() => {
    if (!gift || items.length === 0) return undefined;
    let cancelled = false;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        if (!cancelled) setGiftPreviewError("Please sign in to continue with this gift.");
        return;
      }
      let q: any = null;
      let ok = false;
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderIntent: makeOrderIntent(), preview: true }),
        });
        q = await res.json().catch(() => null);
        ok = res.ok && !!q?.ok;
      } catch {
        ok = false;
      }
      if (cancelled) return;
      if (!ok) {
        setGiftPreview(null);
        setGiftPreviewError(q?.error || "We couldn't check this gift. Please try again.");
        // Someone else just covered delivery: untick it and look again.
        if (/just paid/i.test(q?.error || "")) setGiftPayDelivery(false);
        return;
      }
      setGiftPreviewError("");
      setGiftPreview({ subtotal: q.subtotal, delivery: q.delivery, deliveryFee: q.deliveryFee ?? 0, deliveryCovered: !!q.deliveryCovered, discount: q.discount || 0, total: q.total });
      if (q.deliveryCovered && giftPayDelivery) setGiftPayDelivery(false);
    })();
    return () => { cancelled = true; };
  }, [gift, items, giftPayDelivery, appliedCoupon]);

  const handleSuccessfulPayment = async (response: any) => {
    if (paymentHandledRef.current) {
      // A duplicate onSuccess firing for a transaction already being (or
      // already finished being) processed — ignore it outright rather than
      // letting two executions race each other.
      console.warn("Duplicate onSuccess callback ignored for", response?.reference);
      return;
    }
    paymentHandledRef.current = true;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Your session expired. Please sign in again, then check Orders before paying again.");
        setPlacing(false);
        return;
      }

      const verify = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reference: response.reference,
          orderIntent: makeOrderIntent(),
        }),
      });

      const result = await verify.json();

      if (result.processing) {
        // Another process (a duplicate callback, or the reconciliation
        // webhook) is already mid-fulfillment for this exact reference.
        // This is NOT a failure — the order is very likely about to exist —
        // so don't tell the buyer to contact support over nothing.
        setError(
          "Your payment was received and your order is still being confirmed. " +
          "Please wait a moment, then check Orders before trying again."
        );
        setPlacing(false);
        return;
      }

      if (!result.verified || !result.orderIds || result.orderIds.length === 0) {
        setError(result.error || result.reason || "Your payment wasn't completed. Please try again.");
        setPlacing(false);
        return;
      }

      // result.created (fresh) or result.alreadyCreated (this reference was
      // already fulfilled by an earlier request/the webhook) both mean the
      // order genuinely exists — either way, this is success.
      // (Coupon usage is now counted on the server when the order is created.)

      sessionStorage.setItem(
        "kat_order_confirmed",
        JSON.stringify(buildConfirmationPayload(result.orderIds, response.reference))
      );

      sessionStorage.removeItem("kat_checkout_items");
      if (gift) {
        sessionStorage.removeItem("kat_gift_checkout"); // the buyer's own cart is left alone
      } else {
        clearCart();
      }

      setPlacing(false);
      navigate("/order-confirmation");

    } catch (err: any) {
      console.error("ORDER ERROR:", err);
      setError(friendlyOrderError(err));
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder) return;

    // Reset the duplicate-callback guard for this fresh attempt — it should
    // only block a second firing WITHIN one payment, not block the buyer
    // from ever retrying after a genuine earlier failure.
    paymentHandledRef.current = false;

    setPlacing(true);
    setError("");

    const PaystackPop = (window as any).PaystackPop;

    if (!PaystackPop) {
      setError("Paystack failed to load.");
      setPlacing(false);
      return;
    }

    try {
      // Ask the server what this order really costs BEFORE opening the payment
      // popup. We charge exactly the server's amount, with an unguessable reference.
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Please sign in to complete your purchase.");
        setPlacing(false);
        return;
      }

      const quoteRes = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderIntent: makeOrderIntent() }),
      });
      const quote = await quoteRes.json().catch(() => null);

      if (!quoteRes.ok || !quote?.ok) {
        setError(quote?.error || "We couldn't confirm your order total. Please try again.");
        setPlacing(false);
        return;
      }

      if (quote.total !== total) {
        // Prices or fees changed since this page loaded: show the new numbers, don't charge yet.
        setItems((prev) =>
          prev.map((i) => {
            const q = (quote.items || []).find(
              (x: any) =>
                x.listingId === i.listingId &&
                (x.selectedColor || null) === (i.selectedColor || null) &&
                (x.selectedSize || null) === (i.selectedSize || null)
            );
            return q ? { ...i, price: q.unitPrice } : i;
          })
        );
        setError(`Some prices were updated. Your total is now ${formatNaira(quote.total)}. Please review it and tap Pay again.`);
        setPlacing(false);
        return;
      }

      // Remember these delivery details for next time (best effort, never blocks payment).
      if (!gift && user?.id) {
        localStorage.setItem("kat_address", address.trim());
        void supabase
          .from("profiles")
          .update({ address: address.trim(), delivery_state: state, delivery_city: city })
          .eq("id", user.id)
          .then(() => undefined, () => undefined);
      }

      // Paystack Popup v2 API — the script tag in index.html must be
      // https://js.paystack.co/v2/inline.js for this to work.
      const popup = new PaystackPop();
      popup.newTransaction({
        // Set VITE_PAYSTACK_PUBLIC_KEY in Vercel (use your pk_live_ key at launch).
        key:
          (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY ||
          "pk_test_f4a152b1348a3c6f5c4b415f3341691ea02b2e2c",
        email: user?.email || SUPPORT_EMAIL,
        amount: quote.amountKobo,
        currency: "NGN",
        reference: quote.reference,
        // FIX: attach the full order intent as Paystack metadata. Paystack
        // echoes metadata back on both the client success callback AND the
        // server-side webhook event. If the browser tab closes, loses
        // network, or the client-side insert fails entirely right after a
        // successful charge, the webhook (paystack-webhook.js) can still
        // reconstruct the exact same orders from this metadata — a
        // successful payment can no longer permanently disappear just
        // because the client never made it back to finish the job.
        metadata: {
          orderIntent: makeOrderIntent(),
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

            {gift && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" /> Gift for {gift.recipient.name || "your friend"}, from {gift.from}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  It will be delivered to their saved address, which stays private. You can choose below whether to pay for delivery.
                </p>
              </div>
            )}

            {!gift && (
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" placeholder="e.g. Anike Johnson" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl h-11" />
            </div>
            )}

            {(!gift || giftNeedsPhone) && (
            <div className="space-y-1.5">
              <Label htmlFor="phone">{gift ? "Recipient's phone number" : "Phone number"}</Label>
              <Input id="phone" placeholder="e.g. 08012345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-11" type="tel" inputMode="tel" />
              {phone.trim().length === 0 && (
                <p className="text-xs text-muted-foreground">Please enter a phone number.</p>
              )}
              {phone.trim().length > 0 && !isValidPhone && (
                <p className="text-xs text-destructive">Please enter a valid phone number (e.g. 08012345678).</p>
              )}
            </div>
            )}

            {!gift && (
            <div className="space-y-1.5">
              <Label htmlFor="address">Delivery address</Label>
              <Input id="address" placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl h-11" />
            </div>
            )}

            {!gift && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Select
                  value={state}
                  onValueChange={(value) => {
                    setState(value);
                    setCity("");
                    setDeliveryFee(0);
                  }}
                >
                  <SelectTrigger id="state" className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {NIGERIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    const hasStandard = selected?.delivery_fee !== null && selected?.delivery_fee !== undefined;
                    const hasDoor = selected?.door_delivery_fee !== null && selected?.door_delivery_fee !== undefined;
                    setStandardAvailable(hasStandard);
                    setDeliveryFee(hasStandard ? selected.delivery_fee : 0);
                    setDoorDeliveryFee(hasDoor ? selected.door_delivery_fee : null);
                    // Default to whichever method this area actually offers —
                    // some areas are doorstep-only, so defaulting to "standard"
                    // unconditionally would silently offer a delivery option
                    // that doesn't exist there.
                    setDeliveryMethod(hasStandard ? "standard" : "door");
                    setDeliveryNote(selected?.delivery_note || null);
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

              {deliveryNote && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">{deliveryNote}</p>
              )}

              {citySelected && standardAvailable && doorDeliveryFee !== null && (
                // Both methods offered here — let the buyer choose.
                <div className="space-y-1.5">
                  <Label>Delivery method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("standard")}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        deliveryMethod === "standard" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <p className="text-sm font-semibold">Standard</p>
                      <p className="text-xs text-muted-foreground">{formatNaira(deliveryFee)}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("door")}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        deliveryMethod === "door" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <p className="text-sm font-semibold">Door delivery</p>
                      <p className="text-xs text-muted-foreground">{formatNaira(doorDeliveryFee)}</p>
                    </button>
                  </div>
                </div>
              )}

              {citySelected && !standardAvailable && doorDeliveryFee !== null && (
                // Doorstep-only area — nothing to choose between, so just
                // state it plainly instead of showing a toggle with a fake
                // "Standard" option that was never actually offered here.
                <div className="rounded-xl border-2 border-primary bg-primary/5 p-3">
                  <p className="text-sm font-semibold">Door delivery (only option for this area)</p>
                  <p className="text-xs text-muted-foreground">{formatNaira(doorDeliveryFee)}</p>
                </div>
              )}
            </div>
            )}

            {gift && (
              <div className="space-y-3">
                {giftPreviewError && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2" role="alert">{giftPreviewError}</p>
                )}
                {!giftPreview && !giftPreviewError && (
                  <p className="text-xs text-muted-foreground">Checking your gift…</p>
                )}
                {giftPreview && giftPreview.deliveryCovered && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3">
                    <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Delivery already covered
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      An earlier gift already paid delivery for {gift.recipient.name || "their"}{gift.recipient.name ? "'s" : ""} parcel, so yours goes out with it at no extra cost.
                    </p>
                  </div>
                )}
                {giftPreview && !giftPreview.deliveryCovered && (
                  <label className={`flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer ${giftPayDelivery ? "border-primary bg-primary/5" : "border-border"}`}>
                    <input type="checkbox" className="mt-1" checked={giftPayDelivery} onChange={(e) => setGiftPayDelivery(e.target.checked)} />
                    <span>
                      <span className="block text-sm font-semibold">
                        Also pay delivery ({formatNaira(giftPreview.deliveryFee)}) so {gift.recipient.name || "their"}{gift.recipient.name ? "'s" : ""} gifts can be sent
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Optional. Gifts wait at KAT and go out together in one parcel once delivery has been paid for. If you don't, another friend or {gift.recipient.name || "the owner"} can.
                      </span>
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" /> Coupon Code
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
              {gift ? (
                giftPreview?.deliveryCovered ? (
                  <span className="font-medium text-emerald-600">Covered by an earlier gift</span>
                ) : delivery === 0 ? (
                  <span className="font-medium text-muted-foreground">Not included</span>
                ) : (
                  <span className="font-medium">{formatNaira(delivery)}</span>
                )
              ) : !citySelected ? (
                <span className="font-medium text-muted-foreground">Select delivery area</span>
              ) : (
                <span className={`font-medium ${delivery === 0 ? "text-emerald-600" : ""}`}>
                  {delivery === 0 ? "Free delivery" : formatNaira(delivery)}
                </span>
              )}
            </div>

            <Separator />
            <div className="flex justify-between font-black text-base">
              <span>Total</span>
              <span className="text-primary">{formatNaira(total)}</span>
            </div>
            {discount > 0 && (
              <p className="text-xs text-emerald-600 font-semibold text-right">You saved {formatNaira(discount)}</p>
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
                {gift ? (giftNeedsPhone && !isValidPhone ? "Enter the recipient's phone number to continue" : "Checking your gift…") : "Fill in your name, phone, address, state and delivery area to continue"}
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
              {gift ? (giftNeedsPhone && !isValidPhone ? "Enter the recipient's phone number to continue" : "Checking your gift…") : "Fill in your name, phone, address, state and delivery area to continue"}
            </p>
          )}
          {payCta}
        </div>
      </div>
    </div>
  );
    }

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, MapPin, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { NIGERIAN_STATES } from "@/lib/nigeriaStates";

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

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
  const total = subtotal + delivery;

  const canPlaceOrder =
    fullName.trim().length > 0 &&
    phone.trim().length > 0 &&
    address.trim().length > 0 &&
    !!state &&
    !!city;

  const handleSuccessfulPayment = async (response: any) => {
    try {
      const verify = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: response.reference,
        }),
      });

      const result = await verify.json();

      if (!result.verified) {
        setError("Payment verification failed");
        setPlacing(false);
        return;
      }

      const orderIds: string[] = [];

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("payment_ref", response.reference)
        .single();

      if (existingOrder) {
        return;
      }

      for (const item of items) {
        const { data: product } = await supabase
          .from("products")
          .select("seller_id")
          .eq("id", item.listingId)
          .single();

        const { data, error } = await supabase
          .from("orders")
          .insert({
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
            status: "pending",
            seller_status: "pending",
            admin_status: "pending",
            seller_id: product?.seller_id || null,
            payment_ref: response.reference,
          })
          .select()
          .single();

        if (error) throw error;

        if (data) orderIds.push(data.id);
      }

      sessionStorage.setItem(
        "kat_order_confirmed",
        JSON.stringify({
          orderIds,
          items,
          total,
          delivery,
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: `${address.trim()}, ${city.trim()}`,
          paymentRef: response.reference,
          createdAt: new Date().toISOString(),
        })
      );

      sessionStorage.removeItem("kat_checkout_items");
      clearCart();

      setPlacing(false);
      navigate("/order-confirmation");

    } catch (err: any) {
      console.error("ORDER ERROR:", err);
      setError(err.message);
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
        onSuccess: (response: any) => {
          handleSuccessfulPayment(response);
        },
        onCancel: () => {
          setPlacing(false);
        },
        onError: (err: any) => {
          console.error("PAYSTACK ERROR:", err);
          setError(err?.message || "Payment failed");
          setPlacing(false);
        },
      });

    } catch (err: any) {
      console.error("ORDER ERROR FULL:", err);
      setError(err.message || "Order creation failed");
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

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-base font-black">Checkout</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Delivery Address
          </p>
          <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl h-11" />
          <Input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-11" type="tel" />
          <Input placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl h-11" />

          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setCity("");
              setDeliveryFee(0);
            }}
            className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select State</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
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
              {state ? "Select City" : "Select State First"}
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.city}>
                {c.city}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" /> Order Items ({items.length})
          </p>
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center">
              <img src={item.imageUrl} alt={item.title} className="w-14 h-14 rounded-xl object-contain shrink-0 bg-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold line-clamp-1">{item.title}</p>
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
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            {!citySelected ? (
              <span className="font-medium text-muted-foreground">Select delivery area</span>
            ) : (
              <span className={`font-medium ${delivery === 0 ? "text-emerald-600" : ""}`}>
                {delivery === 0 ? "Free 🎉" : formatNaira(delivery)}
              </span>
            )}
          </div>
          <Separator />
          <div className="flex justify-between font-black text-base">
            <span>Total</span>
            <span className="text-primary">{formatNaira(total)}</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center px-4">
          🔒 Payment is secured by Paystack. Your card details are encrypted and never stored on KAT.
        </p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <p className="text-xs text-destructive font-medium">{error}</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-[62px] left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-30">
        <div className="max-w-2xl mx-auto space-y-2">
          {!canPlaceOrder && (
            <p className="text-xs text-center text-muted-foreground">
              Fill in your name, phone, address, state and delivery area to continue
            </p>
          )}
          <Button className="w-full rounded-full font-bold h-12 text-sm" disabled={!canPlaceOrder || placing} onClick={handlePlaceOrder}>
            {placing ? "Placing order..." : `Place Order — ${formatNaira(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
                                         }

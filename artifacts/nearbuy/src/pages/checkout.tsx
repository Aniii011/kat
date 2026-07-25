import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, MapPin, CreditCard, Banknote, Lock, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer">("card");
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
  const delivery = subtotal >= 25000 ? 0 : deliveryFee;
  const total = subtotal + delivery;
  const canPlaceOrder = fullName.trim() && phone.trim() && address.trim() && city.trim();
  
const handleSuccessfulPayment = async (response: any) => {
  console.log("STEP 1: Payment callback received", response);

  try {
    console.log("STEP 2: Verifying payment");

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

    console.log("STEP 3: Verification result", result);

    if (!result.verified) {
      console.log("FAILED VERIFICATION");
      setError("Payment verification failed");
      setPlacing(false);
      return;
    }

    console.log("STEP 4: Creating orders");

  
  
    const orderIds: string[] = [];

    const { data: existingOrder } = await supabase
  .from("orders")
  .select("id")
  .eq("payment_ref", response.reference)
  .single();

if (existingOrder) {
  console.log("Order already created");
  return;
}
    for (const item of items) {
      console.log("CREATING ORDER FOR:", item.title);
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
          status: "pending",
          seller_status: "pending",
          admin_status: "pending",
          seller_id: product?.seller_id || null,
          payment_ref: response.reference,
        })
        .select()
        .single();
      console.log("ORDER RESULT:", data, error);

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
    paymentMethod,
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
    console.log("PaystackPop =", PaystackPop);
    const handler = PaystackPop.setup({
  key: "pk_test_f4a152b1348a3c6f5c4b415f3341691ea02b2e2c",
  email: user?.email || "customer@kat.ng",
  amount: total * 100,
  currency: "NGN",
  ref: `KAT-${Date.now()}`,

  callback: (response: any) => {
  handleSuccessfulPayment(response);
},

  onClose: () => {
    setPlacing(false);
  },
});
handler.openIframe();

  } catch (err: any) {
  console.error("ORDER ERROR FULL:", err);
  console.error(err);
alert(err?.message || "Unknown error");
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
          <Select
  value={state}
  onValueChange={(value) => {
    setState(value);
    setCity("");
    setDeliveryFee(0);
  }}
>
  <SelectTrigger className="rounded-xl h-11">
    <SelectValue placeholder="Select State" />
  </SelectTrigger>

  <SelectContent>
    {NIGERIAN_STATES.map((s) => (
      <SelectItem key={s} value={s}>
        {s}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

<Select
  value={city}
  onValueChange={(value) => {
    setCity(value);

    const selected = cities.find((c) => c.city === value);
    setDeliveryFee(selected?.delivery_fee || 0);
  }}
>
  <SelectTrigger className="rounded-xl h-11">
    <SelectValue placeholder="Select City" />
  </SelectTrigger>

  <SelectContent>
    {cities.map((c) => (
      <SelectItem key={c.id} value={c.city}>
        {c.city}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Payment Method
          </p>
          <button onClick={() => setPaymentMethod("card")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"}`}>
            <CreditCard className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-semibold flex-1 text-left">Debit/Credit Card</span>
            {paymentMethod === "card" && <Lock className="w-3.5 h-3.5 text-primary" />}
          </button>
          <button onClick={() => setPaymentMethod("transfer")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === "transfer" ? "border-primary bg-primary/5" : "border-border"}`}>
            <Banknote className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-semibold flex-1 text-left">Bank Transfer</span>
            {paymentMethod === "transfer" && <Lock className="w-3.5 h-3.5 text-primary" />}
          </button>
          <p className="text-[11px] text-muted-foreground">Secure payment powered by Paystack. Your card details are encrypted and never stored.</p>
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
            <span className={`font-medium ${delivery === 0 ? "text-emerald-600" : ""}`}>
              {delivery === 0 ? "Free 🎉" : formatNaira(delivery)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between font-black text-base">
            <span>Total</span>
            <span className="text-primary">{formatNaira(total)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <p className="text-xs text-destructive font-medium">{error}</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-[62px] left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-30">
        <div className="max-w-2xl mx-auto">
          <Button className="w-full rounded-full font-bold h-12 text-sm" disabled={!canPlaceOrder || placing} onClick={handlePlaceOrder}>
            {placing ? "Placing order..." : `Place Order — ${formatNaira(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
    }

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/hooks/use-cart";
import {
  ArrowLeft, MapPin, CreditCard, Banknote, Lock, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer">("card");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("kat_checkout_items");
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        navigate("/cart");
      }
    } else {
      navigate("/cart");
    }
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivery = subtotal >= 25000 ? 0 : 1500;
  const total = subtotal + delivery;

  const handlePlaceOrder = async () => {
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) return;
    setPlacing(true);

    // Payment integration placeholder — Paystack wiring goes here later
    setTimeout(() => {
      sessionStorage.removeItem("kat_checkout_items");
      setPlacing(false);
      navigate("/");
    }, 1500);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  const canPlaceOrder = fullName.trim() && phone.trim() && address.trim() && city.trim();

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

        {/* Delivery address */}
        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Delivery Address
          </p>
          <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl h-11" />
          <Input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-11" />
          <Input placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl h-11" />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl h-11" />
        </div>

        {/* Payment method */}
        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Payment Method
          </p>
          <button
            onClick={() => setPaymentMethod("card")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
              paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <CreditCard className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-semibold flex-1 text-left">Debit/Credit Card</span>
            {paymentMethod === "card" && <Lock className="w-3.5 h-3.5 text-primary" />}
          </button>
          <button
            onClick={() => setPaymentMethod("transfer")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
              paymentMethod === "transfer" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Banknote className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-semibold flex-1 text-left">Bank Transfer</span>
            {paymentMethod === "transfer" && <Lock className="w-3.5 h-3.5 text-primary" />}
          </button>
          <p className="text-[11px] text-muted-foreground">
            Secure payment powered by Paystack. Your card details are encrypted and never stored.
          </p>
        </div>

        {/* Order items */}
        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" /> Order Items ({items.length})
          </p>
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center">
              <img src={item.imageUrl} alt={item.title} className="w-14 h-14 rounded-xl object-cover shrink-0 bg-muted" />
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

        {/* Order summary */}
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
      </main>

      {/* Sticky place order */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-30">
        <div className="max-w-2xl mx-auto">
          <Button
            className="w-full rounded-full font-bold h-12 text-sm"
            disabled={!canPlaceOrder || placing}
            onClick={handlePlaceOrder}
          >
            {placing ? "Placing order..." : `Place Order — ${formatNaira(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

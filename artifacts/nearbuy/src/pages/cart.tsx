import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  ArrowLeft, Minus, Plus, Trash2, Share2, ShoppingBag,
  Truck, Shield, Copy, Check, Gift, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

const MOCK_COUPONS: Record<string, number> = {
  "KAT10": 10, "SLAY20": 20, "FIRST15": 15, "VIP25": 25,
};

export default function Cart() {
  const { items, updateQty, removeItem, clearCart, totalItems, totalPrice, shareableLink } = useCart();
  const [coupon, setCoupon] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [showGift, setShowGift] = useState(false);

  const delivery = totalPrice >= 25000 ? 0 : 1500;
  const discountAmount = Math.round(totalPrice * (appliedDiscount / 100));
  const grandTotal = totalPrice - discountAmount + delivery;

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    const discount = MOCK_COUPONS[code];
    if (discount) {
      setAppliedDiscount(discount);
      setCouponSuccess(`${discount}% discount applied! 🎉`);
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code. Try KAT10, SLAY20, or FIRST15");
      setCouponSuccess("");
    }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareableLink()); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-black">My Cart</h1>
            {totalItems > 0 && <p className="text-[11px] text-muted-foreground">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>}
          </div>
          <ThemeSwitcher />
          {items.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive rounded-full" onClick={copyLink}>
              {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Share2 className="w-3.5 h-3.5 mr-1" />}
              {copied ? "Copied!" : "Share"}
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-32">
        {items.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-9 h-9 text-muted-foreground" />
            </div>
            <p className="font-bold text-lg">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mt-2">Find something you love and add it to your bag</p>
            <Link href="/">
              <Button className="mt-6 rounded-full px-8 font-semibold">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div key={`${item.listingId}-${item.selectedSize}-${item.selectedColor}`}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="bg-card border border-card-border rounded-2xl p-3 flex gap-3"
                >
                  <Link href={`/listing/${item.listingId}`}>
                    <img src={item.imageUrl} alt={item.title} className="w-20 h-24 rounded-xl object-cover shrink-0 cursor-pointer" />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{item.sellerName}</p>
                        <p className="text-sm font-semibold leading-tight line-clamp-2">{item.title}</p>
                      </div>
                      <button onClick={() => removeItem(item.listingId, item.selectedSize, item.selectedColor)}
                        className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.selectedSize && <span className="text-[10px] border border-border rounded-full px-2 py-0.5">{item.selectedSize}</span>}
                      {item.selectedColor && <span className="text-[10px] border border-border rounded-full px-2 py-0.5">{item.selectedColor}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <p className="font-black text-primary">{formatNaira(item.price)}</p>
                      <div className="flex items-center gap-2 border border-border rounded-full px-2 py-1">
                        <button onClick={() => updateQty(item.listingId, item.quantity - 1, item.selectedSize, item.selectedColor)}
                          className="w-5 h-5 flex items-center justify-center hover:text-primary transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.listingId, item.quantity + 1, item.selectedSize, item.selectedColor)}
                          className="w-5 h-5 flex items-center justify-center hover:text-primary transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Gift note */}
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <button onClick={() => setShowGift(!showGift)}
                className="flex items-center gap-2 text-sm font-semibold w-full text-left">
                <Gift className="w-4 h-4 text-primary" /> Add gift note
                <span className="ml-auto text-muted-foreground text-xs">{showGift ? "▲" : "▼"}</span>
              </button>
              <AnimatePresence>
                {showGift && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <textarea value={giftNote} onChange={(e) => setGiftNote(e.target.value)}
                      placeholder="Write a personal message for the recipient..."
                      className="w-full mt-3 text-sm bg-muted rounded-xl p-3 resize-none h-20 outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Coupon */}
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> Coupon code</p>
              <div className="flex gap-2">
                <Input placeholder="Enter code (e.g. KAT10)" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()} className="rounded-xl text-sm flex-1" />
                <Button size="sm" onClick={applyCoupon} className="rounded-xl px-4">Apply</Button>
              </div>
              {couponError && <p className="text-xs text-destructive">{couponError}</p>}
              {couponSuccess && <p className="text-xs text-emerald-600 font-semibold">{couponSuccess}</p>}
            </div>

            {/* Order summary */}
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2.5">
              <p className="font-bold text-sm">Order summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                  <span className="font-medium">{formatNaira(totalPrice)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon discount (-{appliedDiscount}%)</span>
                    <span className="font-medium">-{formatNaira(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className={`font-medium ${delivery === 0 ? "text-emerald-600" : ""}`}>
                    {delivery === 0 ? "Free 🎉" : formatNaira(delivery)}
                  </span>
                </div>
                {delivery > 0 && (
                  <p className="text-[10px] text-muted-foreground bg-muted rounded-lg px-2.5 py-1.5">
                    💡 Add {formatNaira(25000 - totalPrice)} more to unlock free delivery
                  </p>
                )}
              </div>
              <Separator />
              <div className="flex justify-between font-black text-base">
                <span>Total</span>
                <span className="text-primary">{formatNaira(grandTotal)}</span>
              </div>
            </div>

            {/* Trust */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <Truck className="w-4 h-4 text-primary" />, text: "Fast nationwide delivery" },
                { icon: <Shield className="w-4 h-4 text-primary" />, text: "Buyer protection guaranteed" },
              ].map((b) => (
                <div key={b.text} className="bg-card border border-card-border rounded-xl p-2.5 flex items-center gap-2">
                  {b.icon}
                  <span className="text-[11px] font-medium">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky checkout */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-30">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10 font-semibold" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copied ? "Copied" : "Share Cart"}
            </Button>
            <Button className="flex-1 rounded-full font-bold h-12 text-sm">
              Checkout — {formatNaira(grandTotal)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

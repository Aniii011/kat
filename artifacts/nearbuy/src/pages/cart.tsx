import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { useListings } from "@/hooks/use-listings";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  ArrowLeft, Minus, Plus, Trash2, Share2, ShoppingBag,
  Truck, Shield, Copy, Check, Gift, Tag, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

const MOCK_COUPONS: Record<string, number> = {
  "KAT10": 10, "SLAY20": 20, "FIRST15": 15, "VIP25": 25,
};

export default function Cart() {
  const {
    items, updateQty, removeItem, totalItems, totalPrice, shareableLink,
    savedItems, removeSaved, moveToCart,
  } = useCart();
  const { listings: allListings } = useListings();

  const [coupon, setCoupon] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [showGift, setShowGift] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    () => new Set(items.map((i) => `${i.listingId}-${i.selectedSize}-${i.selectedColor}`))
  );

  const itemKey = (i: { listingId: string; selectedSize?: string; selectedColor?: string }) =>
    `${i.listingId}-${i.selectedSize}-${i.selectedColor}`;

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allChecked = items.length > 0 && items.every((i) => checkedItems.has(itemKey(i)));
  const toggleAll = () => {
    if (allChecked) {
      setCheckedItems(new Set());
    } else {
      setCheckedItems(new Set(items.map(itemKey)));
    }
  };

  const selectedItems = items.filter((i) => checkedItems.has(itemKey(i)));
  const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0);
  const selectedSubtotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const delivery = selectedSubtotal >= 25000 || selectedSubtotal === 0 ? 0 : 1500;
  const discountAmount = Math.round(selectedSubtotal * (appliedDiscount / 100));
  const grandTotal = selectedSubtotal - discountAmount + delivery;

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

  // Recommended items — exclude what's already in cart/saved
  const cartIds = new Set(items.map((i) => i.listingId));
  const savedIds = new Set(savedItems.map((i) => i.listingId));
  const recommended = allListings
    .filter((l) => !cartIds.has(l.id) && !savedIds.has(l.id))
    .slice(0, 6);

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
            <Button variant="ghost" size="sm" className="text-xs rounded-full" onClick={copyLink}>
              {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Share2 className="w-3.5 h-3.5 mr-1" />}
              {copied ? "Copied!" : "Share"}
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-40">
        {items.length === 0 && savedItems.length === 0 ? (
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

            {/* Select all */}
            {items.length > 0 && (
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm font-semibold px-1"
              >
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  allChecked ? "bg-primary border-primary" : "border-border"
                }`}>
                  {allChecked && <Check className="w-3 h-3 text-primary-foreground" />}
                </span>
                Select all ({items.length})
              </button>
            )}

            {/* Cart items */}
            <AnimatePresence>
              {items.map((item) => {
                const key = itemKey(item);
                const checked = checkedItems.has(key);
                return (
                  <motion.div key={key}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="bg-card border border-card-border rounded-2xl p-3 flex gap-3"
                  >
                    <button
                      onClick={() => toggleCheck(key)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
                        checked ? "bg-primary border-primary" : "border-border"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-primary-foreground" />}
                    </button>

                    <Link href={`/listing/${item.listingId}`}>
                      <img src={item.imageUrl} alt={item.title} className="w-20 h-24 rounded-xl object-cover shrink-0 cursor-pointer bg-muted" />
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
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="text-[11px] text-muted-foreground">
                          {[item.selectedColor, item.selectedSize].filter(Boolean).join(" / ")}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <p className="font-black text-primary">{formatNaira(item.price)}</p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.listingId, item.quantity - 1, item.selectedSize, item.selectedColor)}
                            className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.listingId, item.quantity + 1, item.selectedSize, item.selectedColor)}
                            className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                            <Plus className="w-3 h-3 text-primary-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {items.length > 0 && (
              <>
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
                      <span className="text-muted-foreground">Subtotal ({selectedCount} selected)</span>
                      <span className="font-medium">{formatNaira(selectedSubtotal)}</span>
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
                        💡 Add {formatNaira(25000 - selectedSubtotal)} more to unlock free delivery
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
              </>
            )}

            {/* Saved for later */}
            {savedItems.length > 0 && (
              <section className="pt-2">
                <p className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" /> Saved for Later ({savedItems.length})
                </p>
                <div className="space-y-2">
                  {savedItems.map((item) => (
                    <div key={item.listingId} className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-center">
                      <Link href={`/listing/${item.listingId}`}>
                        <img src={item.imageUrl} alt={item.title} className="w-14 h-14 rounded-xl object-cover shrink-0 bg-muted" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{item.sellerName}</p>
                        <p className="text-sm font-semibold line-clamp-1">{item.title}</p>
                        <p className="text-sm font-black text-primary mt-0.5">{formatNaira(item.price)}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button size="sm" className="rounded-full text-xs h-7" onClick={() => moveToCart(item)}>
                          Move to Cart
                        </Button>
                        <button
                          onClick={() => removeSaved(item.listingId)}
                          className="text-[10px] text-muted-foreground hover:text-destructive text-center"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recommended */}
            {recommended.length > 0 && (
              <section className="pt-4">
                <p className="text-sm font-bold mb-3">You might like to fill it with ✨</p>
                <div className="grid grid-cols-2 gap-3">
                  {recommended.map((item) => (
                    <Link key={item.id} href={`/listing/${item.id}`}>
                      <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-md transition-all cursor-pointer">
                        <div className="aspect-square bg-muted overflow-hidden">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain" />
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-semibold line-clamp-2 leading-tight">{item.title}</p>
                          <p className="text-sm font-black text-primary mt-1">{formatNaira(item.price)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Sticky checkout — sits above bottom nav */}
      {items.length > 0 && (
        <div className="fixed bottom-[62px] left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-30">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10 font-semibold shrink-0" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copied ? "Copied" : "Share"}
            </Button>
            <Button
              className="flex-1 rounded-full font-bold h-12 text-sm"
              disabled={selectedItems.length === 0}
            >
              Checkout ({selectedCount}) — {formatNaira(grandTotal)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
                    }

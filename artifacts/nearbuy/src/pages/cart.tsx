import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { useListings } from "@/hooks/use-listings";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Check, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

export default function Cart() {
  const {
    items, updateQty, removeItem, totalItems,
    savedItems, removeSaved, moveToCart,
  } = useCart();
  const { listings: allListings } = useListings();
  const [, navigate] = useLocation();

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
    setCheckedItems(allChecked ? new Set() : new Set(items.map(itemKey)));
  };

  const selectedItems = items.filter((i) => checkedItems.has(itemKey(i)));
  const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0);
  const selectedSubtotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    sessionStorage.setItem("kat_checkout_items", JSON.stringify(selectedItems));
    navigate("/checkout");
  };

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

            {items.length > 0 && (
              <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-semibold px-1">
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  allChecked ? "bg-primary border-primary" : "border-border"
                }`}>
                  {allChecked && <Check className="w-3 h-3 text-primary-foreground" />}
                </span>
                Select all ({items.length})
              </button>
            )}

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

            {selectedItems.length > 0 && (
              <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({selectedCount} selected)</span>
                  <span className="font-bold">{formatNaira(selectedSubtotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-black text-base">
                  <span>Total</span>
                  <span className="text-primary">{formatNaira(selectedSubtotal)}</span>
                </div>
              </div>
            )}

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

      {items.length > 0 && (
        <div className="fixed bottom-[62px] left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-30">
          <div className="max-w-2xl mx-auto">
            <Button
              className="w-full rounded-full font-bold h-12 text-sm"
              disabled={selectedItems.length === 0}
              onClick={handleCheckout}
            >
              Checkout ({selectedCount}) — {formatNaira(selectedSubtotal)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
                          }

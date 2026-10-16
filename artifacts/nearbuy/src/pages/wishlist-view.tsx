import React, { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft, Heart, ShoppingBag, CheckCircle2, Gift, Lock,
} from "lucide-react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthModal from "@/components/auth-modal";

function formatNaira(n: number) { return "₦" + Number(n || 0).toLocaleString("en-NG"); }

export default function WishlistView() {
  const [, params] = useRoute("/wishlist/:id");
  const wishlistId = params?.id ?? null;
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [wishlist, setWishlist] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [giftingItem, setGiftingItem] = useState<any>(null);
  const [gifterName, setGifterName] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!wishlistId) return;
    fetchWishlist();
  }, [wishlistId]);

  const fetchWishlist = async () => {
    setLoading(true);
    // Loaded through a database function that returns this one wishlist (found by
    // its id from the shared link), so the wishlists table can't be read in bulk.
    const { data } = await supabase.rpc("get_public_wishlist", { p_id: wishlistId });

    if (!data) { navigate("/"); return; }
    const { items: wlItems, ...wl } = data as any;
    setWishlist(wl);
    setItems(wlItems || []);
    setLoading(false);
  };

  // The public wishlist no longer carries the owner's phone or street address (see
  // get_public_wishlist). It only says whether an address is on file. The `??`
  // fallbacks keep this page working before and after the database function is updated.
  const looksLikePhone = (v: any) => {
    const d = String(v || "").replace(/\D/g, "");
    return /^0\d{10}$/.test(d) || /^234\d{10}$/.test(d);
  };
  const hasDeliveryAddress: boolean = wishlist?.has_delivery_address ?? !!wishlist?.delivery_address;
  const recipientFirstName: string =
    wishlist?.recipient_first_name ?? (String(wishlist?.delivery_name || "").trim().split(" ")[0] || "");
  const recipientHasValidPhone: boolean = wishlist?.has_valid_delivery_phone ?? looksLikePhone(wishlist?.delivery_phone);

  // Start a gift checkout. Nothing is marked "purchased" here: that happens on the
  // server only after the payment is confirmed (see api/_lib/fulfill.js).
  const handleGiftItem = (item: any) => {
    const name = gifterName.trim();
    if (!name || !hasDeliveryAddress) return;

    // Paying needs an account. Ask them to sign in, then they tap the button again.
    if (!user) {
      setShowAuth(true);
      return;
    }

    setPurchasing(true);

    // The gift is checked out on its own, never mixed into the buyer's cart.
    sessionStorage.setItem("kat_checkout_items", JSON.stringify([{
      listingId: item.product_id,
      title: item.title,
      price: Number(item.price),
      imageUrl: item.image_url,
      sellerName: "KAT",
      quantity: 1,
    }]));

    // Who it is for and who it is from. The server re-reads the recipient's real
    // details from the wishlist, so nothing here can redirect the delivery.
    sessionStorage.setItem("kat_gift_checkout", JSON.stringify({
      wishlistItemId: item.id,
      productId: item.product_id,
      from: name,
      // Only a first name and "do we need a phone from you" travel to checkout.
      // The recipient's phone and street address never reach the gifter's browser.
      recipient: {
        name: recipientFirstName,
        needsPhone: !recipientHasValidPhone,
      },
    }));

    setGiftingItem(null);
    setPurchasing(false);
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading wishlist...</p>
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-3 p-6 text-center">
        <Lock className="w-10 h-10 text-muted-foreground" />
        <p className="font-bold">Wishlist not found</p>
        <Link href="/"><Button variant="outline" size="sm" className="rounded-full">Go to KAT</Button></Link>
      </div>
    );
  }

  const availableItems = items.filter((i) => !i.is_purchased);
  const purchasedItems = items.filter((i) => i.is_purchased);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-base font-black flex-1 truncate">{wishlist.emoji} {wishlist.name}</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Gift modal */}
        {giftingItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card border border-card-border rounded-3xl p-6 max-w-sm w-full shadow-xl space-y-4">
              <h3 className="font-black text-base flex items-center gap-2"><Gift className="w-4 h-4 text-primary" /> Buy as a Gift</h3>
              <div className="flex gap-3 items-center bg-muted rounded-xl p-3">
                <img src={giftingItem.image_url} alt={giftingItem.title} className="w-12 h-12 rounded-xl object-contain bg-background shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{giftingItem.title}</p>
                  <p className="text-sm font-black text-primary">{formatNaira(giftingItem.price)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Your name (so they know who gifted it)</p>
                <Input placeholder="Your name" value={gifterName} onChange={(e) => setGifterName(e.target.value)} className="rounded-xl h-11" autoFocus />
              </div>
              {hasDeliveryAddress ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1"><Package className="w-3.5 h-3.5" /> Delivery to:</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{recipientFirstName ? `${recipientFirstName}'s` : "Their"} saved address — kept private, only our delivery team sees it.</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">At checkout you'll pick their state and city so we can price delivery.</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700">This wishlist has no delivery address yet, so it can't be gifted. Ask the owner to add one.</p>
                </div>
              )}
              {!user && hasDeliveryAddress && (
                <p className="text-[11px] text-muted-foreground text-center">You'll be asked to sign in before you pay.</p>
              )}
              <Button className="w-full rounded-full font-bold h-12 gap-2" onClick={() => handleGiftItem(giftingItem)} disabled={!gifterName.trim() || !hasDeliveryAddress || purchasing}>
                {purchasing ? "Processing..." : <><ShoppingBag className="w-4 h-4" /> Buy this Gift — {formatNaira(giftingItem.price)}</>}
              </Button>
              <Button variant="ghost" size="sm" className="w-full rounded-full" onClick={() => setGiftingItem(null)}>Cancel</Button>
            </motion.div>
          </div>
        )}

        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/15 rounded-3xl p-5 text-center">
          <div className="text-5xl mb-2">{wishlist.emoji}</div>
          <h2 className="text-xl font-black">{wishlist.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {recipientFirstName ? `${recipientFirstName}'s wishlist` : "Wishlist"} · {availableItems.length} item{availableItems.length !== 1 ? "s" : ""} available
          </p>
          <p className="text-xs text-muted-foreground mt-3 bg-background/60 rounded-xl px-3 py-2">
            Pick an item below and buy it as a gift — it'll be delivered directly to them!
          </p>
        </div>

        {/* Available items */}
        {availableItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-bold">Available to gift</p>
            {availableItems.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-center">
                <Link href={`/listing/${item.product_id}`}>
                  <img src={item.image_url} alt={item.title} className="w-16 h-16 rounded-xl object-contain bg-muted shrink-0 cursor-pointer" />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-2 leading-tight">{item.title}</p>
                  <p className="text-sm font-black text-primary mt-0.5">{formatNaira(item.price)}</p>
                </div>
                <Button size="sm" className="rounded-full text-xs shrink-0 gap-1" onClick={() => { setGiftingItem(item); setGifterName(""); }}>
                  <Gift className="w-3.5 h-3.5" /> Gift
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Purchased items */}
        {purchasedItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-muted-foreground">Already gifted</p>
            {purchasedItems.map((item) => (
              <div key={item.id} className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-center opacity-60">
                <img src={item.image_url} alt={item.title} className="w-16 h-16 rounded-xl object-contain bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{item.title}</p>
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Gifted{item.purchased_by_name ? ` by ${item.purchased_by_name}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
            <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-sm">This wishlist is empty</p>
          </div>
        )}

        <div className="text-center pt-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="rounded-full gap-1">
              <ShoppingBag className="w-3.5 h-3.5" /> Shop on KAT
            </Button>
          </Link>
        </div>
      </div>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} defaultMode="login" />
    </div>
  );
    }

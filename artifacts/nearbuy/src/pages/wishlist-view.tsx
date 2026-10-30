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
  // The friend can choose one OR SEVERAL items, then pay for them all in one checkout.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [gifterName, setGifterName] = useState("");
  // True when the signed-in person owns this list. They buy from it for themselves,
  // so there is no "who is it from" name to ask for.
  const [isOwner, setIsOwner] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!wishlistId) return;
    fetchWishlist();
  }, [wishlistId]);

  useEffect(() => {
    if (!wishlistId || !user?.id) { setIsOwner(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("id", wishlistId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setIsOwner(!!data);
    })();
    return () => { cancelled = true; };
  }, [wishlistId, user?.id]);

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
  // "Anike's Birthday wishlist": owner's first name + the list's own title.
  const wishlistBase = String(wishlist?.name || "").replace(/\s*wish\s?list\s*$/i, "").trim();
  const wishlistTitle: string = recipientFirstName
    ? `${recipientFirstName}'s ${wishlistBase ? wishlistBase + " " : ""}wishlist`
    : String(wishlist?.name || "Wishlist");
  // can_gift = street address AND state AND city saved. Falls back to the old rule until the
  // database function is updated.
  const canGift: boolean = wishlist?.can_gift ?? hasDeliveryAddress;
  const deliveryCovered: boolean = wishlist?.delivery_covered === true;
  const isAvailable = (item: any) => item.available !== false; // sold out / switched off => false
  const recipientHasValidPhone: boolean = wishlist?.has_valid_delivery_phone ?? looksLikePhone(wishlist?.delivery_phone);

  // Who the gift is from: the owner's own first name when they buy for themselves.
  const ownerFirstName = String(user?.name || "").trim().split(" ")[0] || "Me";
  const giftFromName: string = isOwner ? ownerFirstName : gifterName.trim();

  const selectedItems = items.filter((i) => selectedIds.includes(i.id) && !i.is_purchased && isAvailable(i));
  const selectedTotal = selectedItems.reduce((s, i) => s + Number(i.price || 0), 0);

  const toggleItem = (id: string) =>
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 10 ? cur : [...cur, id]));

  // Start a gift checkout for every selected item. Nothing is marked "purchased" here: that
  // happens on the server only after the payment is confirmed (see api/_lib/fulfill.js).
  const handleGiftSelected = () => {
    const name = giftFromName;
    const chosen = items.filter((i) => selectedIds.includes(i.id) && !i.is_purchased && isAvailable(i));
    if (!name || !canGift || chosen.length === 0) return;

    // Paying needs an account. Ask them to sign in, then they tap the button again.
    if (!user) {
      setShowAuth(true);
      return;
    }

    setPurchasing(true);

    // The gift is checked out on its own, never mixed into the buyer's cart.
    sessionStorage.setItem("kat_checkout_items", JSON.stringify(chosen.map((item) => ({
      listingId: item.product_id,
      title: item.title,
      price: Number(item.price),
      imageUrl: item.image_url,
      sellerName: "KAT",
      quantity: 1,
    }))));

    // Who it is for and who it is from. The server re-reads the recipient's real details
    // from the wishlist, so nothing here can redirect the delivery.
    sessionStorage.setItem("kat_gift_checkout", JSON.stringify({
      wishlistId,
      wishlistItemIds: chosen.map((i) => i.id),
      productIds: chosen.map((i) => i.product_id),
      from: name,
      // Only a first name and "do we need a phone from you" travel to checkout.
      // The recipient's phone and street address never reach the gifter's browser.
      recipient: {
        name: recipientFirstName,
        needsPhone: !recipientHasValidPhone,
      },
    }));

    setGiftDialogOpen(false);
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
          <h1 className="text-base font-black flex-1 truncate">{wishlist.emoji} {wishlistTitle}</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Gift dialog (one or several items) */}
        {giftDialogOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card border border-card-border rounded-3xl p-6 max-w-sm w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-black text-base flex items-center gap-2"><Gift className="w-4 h-4 text-primary" /> {isOwner ? "Buy for yourself" : "Buy as a Gift"}</h3>
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center bg-muted rounded-xl p-3">
                    <img src={item.image_url} alt={item.title} className="w-12 h-12 rounded-xl object-contain bg-background shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1">{item.title}</p>
                      <p className="text-sm font-black text-primary">{formatNaira(item.price)}</p>
                    </div>
                  </div>
                ))}
                <p className="text-sm font-bold flex justify-between px-1"><span>Items</span><span>{formatNaira(selectedTotal)}</span></p>
              </div>
              {!isOwner && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Your name (so they know who gifted it)</p>
                  <Input placeholder="Your name" value={gifterName} onChange={(e) => setGifterName(e.target.value)} className="rounded-xl h-11" autoFocus />
                </div>
              )}
              {canGift ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {isOwner ? "Delivered to your saved address" : `Delivered to ${recipientFirstName || "them"}`}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isOwner ? "It will be marked as bought on your list, so friends can't buy it again." : "Their address stays private, only our delivery team sees it."}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {deliveryCovered
                      ? (isOwner
                        ? "Delivery for your list is already covered, so you won't pay for it."
                        : "Delivery for this list is already covered by an earlier gift, so you won't pay for it.")
                      : (isOwner
                        ? "At checkout you can pay delivery now, or leave it waiting at KAT and tap Send my gifts later on My gifts."
                        : "At checkout you can choose to pay delivery so the gifts can be sent. It's optional.")}
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700">This wishlist isn't ready to be gifted yet. Ask the owner to finish adding their delivery details.</p>
                </div>
              )}
              {!user && canGift && (
                <p className="text-[11px] text-muted-foreground text-center">You'll be asked to sign in before you pay.</p>
              )}
              <Button className="w-full rounded-full font-bold h-12 gap-2" onClick={handleGiftSelected} disabled={!giftFromName || !canGift || purchasing || selectedItems.length === 0}>
                {purchasing ? "Processing..." : <><ShoppingBag className="w-4 h-4" /> Continue to pay — {formatNaira(selectedTotal)}</>}
              </Button>
              <Button variant="ghost" size="sm" className="w-full rounded-full" onClick={() => setGiftDialogOpen(false)}>Cancel</Button>
            </motion.div>
          </div>
        )}

        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/15 rounded-3xl p-5 text-center">
          <div className="text-5xl mb-2">{wishlist.emoji}</div>
          <h2 className="text-xl font-black">{wishlistTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {availableItems.length} item{availableItems.length !== 1 ? "s" : ""} available
          </p>
          <p className="text-xs text-muted-foreground mt-3 bg-background/60 rounded-xl px-3 py-2">
            Pick one or more items and buy them as a gift. KAT delivers them directly, and their address stays private.
          </p>
        </div>

        {/* Available items */}
        {availableItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-bold">Available to gift</p>
            {!canGift && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-700">This wishlist isn't ready to be gifted yet. Ask the owner to finish adding their delivery details.</p>
              </div>
            )}
            {availableItems.map((item) => {
              const available = isAvailable(item);
              const picked = selectedIds.includes(item.id);
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`bg-card border rounded-2xl p-3 flex gap-3 items-center ${picked ? "border-primary" : "border-card-border"} ${available ? "" : "opacity-60"}`}>
                  <Link href={`/listing/${item.product_id}`}>
                    <img src={item.image_url} alt={item.title} className="w-16 h-16 rounded-xl object-contain bg-muted shrink-0 cursor-pointer" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-2 leading-tight">{item.title}</p>
                    <p className="text-sm font-black text-primary mt-0.5">{formatNaira(item.price)}</p>
                    {!available && <p className="text-xs font-semibold text-muted-foreground mt-0.5">Currently sold out</p>}
                    {available && typeof item.stock_left === "number" && item.stock_left > 0 && item.stock_left <= 3 && (
                      <p className="text-xs font-semibold text-amber-600 mt-0.5">Only {item.stock_left} left</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={picked ? "default" : "outline"}
                    className="rounded-full text-xs shrink-0 gap-1"
                    disabled={!available || !canGift}
                    aria-pressed={picked}
                    onClick={() => toggleItem(item.id)}
                  >
                    {picked ? <><CheckCircle2 className="w-3.5 h-3.5" /> Added</> : <><Gift className="w-3.5 h-3.5" /> {available ? "Gift" : "Sold out"}</>}
                  </Button>
                </motion.div>
              );
            })}
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

      {selectedItems.length > 0 && !giftDialogOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md bg-foreground text-background rounded-full shadow-xl pl-5 pr-2 py-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">{selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} · {formatNaira(selectedTotal)}</p>
          <Button size="sm" className="rounded-full font-bold gap-1" onClick={() => setGiftDialogOpen(true)}>
            <Gift className="w-3.5 h-3.5" /> Gift {selectedItems.length > 1 ? "these" : "this"}
          </Button>
        </div>
      )}

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} defaultMode="login" />
    </div>
  );
                  }

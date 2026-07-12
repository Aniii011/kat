import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { useWishlist } from "@/hooks/use-wishlist";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, Plus, Heart, Share2, Trash2, ShoppingBag,
  MapPin, Edit3, X, Check, Gift, Lock, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatNaira(n: number) { return "₦" + Number(n || 0).toLocaleString("en-NG"); }

const WISHLIST_EMOJIS = ["🎁", "🎂", "💍", "🎄", "🏠", "👗", "💄", "🎓", "✈️", "💜"];

export default function WishlistPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { wishlists, loading, createWishlist, deleteWishlist, updateWishlist, removeFromWishlist } = useWishlist(user?.id || null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎁");
  const [activeWishlist, setActiveWishlist] = useState<string | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<string | null>(null);
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const activeList = wishlists.find((w) => w.id === activeWishlist) || wishlists[0];

  useEffect(() => {
    if (wishlists.length > 0 && !activeWishlist) {
      setActiveWishlist(wishlists[0].id);
    }
  }, [wishlists]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4 p-6 text-center">
        <Heart className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-black">Your Wishlists</h1>
        <p className="text-sm text-muted-foreground">Sign in to create and share wishlists</p>
        <Link href="/me"><Button className="rounded-full">Sign In</Button></Link>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const list = await createWishlist(newName.trim(), newEmoji);
    if (list) setActiveWishlist(list.id);
    setNewName(""); setNewEmoji("🎁");
    setShowCreate(false);
    setCreating(false);
  };

  const handleShare = async (wishlist: any) => {
    if (!wishlist.delivery_address) {
      setEditingDelivery(wishlist.id);
      setDeliveryName(wishlist.delivery_name || user.name || "");
      setDeliveryPhone(wishlist.delivery_phone || "");
      setDeliveryAddress(wishlist.delivery_address || "");
      return;
    }
    const url = `${window.location.origin}/wishlist/${wishlist.id}`;
    if (navigator.share) {
      await navigator.share({
        title: `${wishlist.emoji} ${wishlist.name} — KAT Wishlist`,
        text: `Check out my ${wishlist.name} wishlist on KAT! You can buy me a gift directly 🎁`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const saveDelivery = async (wishlistId: string) => {
    await updateWishlist(wishlistId, {
      delivery_name: deliveryName,
      delivery_phone: deliveryPhone,
      delivery_address: deliveryAddress,
    });
    setEditingDelivery(null);
    // Now share
    const wishlist = wishlists.find((w) => w.id === wishlistId);
    if (wishlist) handleShare({ ...wishlist, delivery_address: deliveryAddress });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/me">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-base font-black flex-1">My Wishlists</h1>
          <Button size="sm" className="rounded-full gap-1 text-xs" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5" /> New List
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Create wishlist modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
              <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-card border border-card-border rounded-3xl p-6 max-w-sm w-full shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base">Create Wishlist</h3>
                  <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {WISHLIST_EMOJIS.map((e) => (
                    <button key={e} onClick={() => setNewEmoji(e)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${newEmoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-accent"}`}>
                      {e}
                    </button>
                  ))}
                </div>
                <Input placeholder="Wishlist name (e.g. Birthday, Wedding)" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} className="rounded-xl h-11" autoFocus />
                <Button className="w-full rounded-full font-bold" onClick={handleCreate} disabled={!newName.trim() || creating}>
                  {creating ? "Creating..." : `Create ${newEmoji} ${newName || "Wishlist"}`}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delivery address modal */}
        <AnimatePresence>
          {editingDelivery && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
              <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-card border border-card-border rounded-3xl p-6 max-w-sm w-full shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base">Add Delivery Address</h3>
                  <button onClick={() => setEditingDelivery(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Your address is needed so gift buyers know where to send your items.</p>
                <div className="space-y-2">
                  <Input placeholder="Your full name" value={deliveryName} onChange={(e) => setDeliveryName(e.target.value)} className="rounded-xl h-10" />
                  <Input placeholder="Phone number" value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} className="rounded-xl h-10" type="tel" />
                  <Input placeholder="Delivery address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="rounded-xl h-10" />
                </div>
                <Button className="w-full rounded-full font-bold" onClick={() => saveDelivery(editingDelivery)} disabled={!deliveryName.trim() || !deliveryAddress.trim()}>
                  Save & Share Wishlist
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Loading wishlists...</p>
          </div>
        ) : wishlists.length === 0 ? (
          <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold text-sm">No wishlists yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">Create a wishlist for your birthday, wedding, or any occasion and share it with friends!</p>
            <Button size="sm" className="rounded-full mt-4 gap-1" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5" /> Create First Wishlist
            </Button>
          </div>
        ) : (
          <>
            {/* Wishlist tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {wishlists.map((w) => (
                <button key={w.id} onClick={() => setActiveWishlist(w.id)}
                  className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${activeWishlist === w.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {w.emoji} {w.name}
                  <span className="text-[10px] opacity-70">({w.items?.length || 0})</span>
                </button>
              ))}
            </div>

            {activeList && (
              <div className="space-y-3">
                {/* Wishlist header */}
                <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-black text-base">{activeList.emoji} {activeList.name}</h2>
                      <p className="text-xs text-muted-foreground">{activeList.items?.length || 0} items</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-full text-xs gap-1" onClick={() => handleShare(activeList)}>
                        {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Share</>}
                      </Button>
                      <button onClick={() => deleteWishlist(activeList.id)} className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Delivery address */}
                  {activeList.delivery_address ? (
                    <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Delivery address set ✓</p>
                        <p className="text-[11px] text-muted-foreground truncate">{activeList.delivery_address}</p>
                      </div>
                      <button onClick={() => { setEditingDelivery(activeList.id); setDeliveryName(activeList.delivery_name || ""); setDeliveryPhone(activeList.delivery_phone || ""); setDeliveryAddress(activeList.delivery_address || ""); }} className="shrink-0">
                        <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingDelivery(activeList.id); setDeliveryName(user.name || ""); setDeliveryPhone(""); setDeliveryAddress(""); }}
                      className="w-full flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors text-xs text-muted-foreground font-medium">
                      <MapPin className="w-3.5 h-3.5" /> Add delivery address to share this wishlist
                    </button>
                  )}
                </div>

                {/* Items */}
                {!activeList.items || activeList.items.length === 0 ? (
                  <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
                    <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold text-sm">No items yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Tap the heart icon on any product to add it here</p>
                    <Link href="/">
                      <Button size="sm" className="rounded-full mt-3 gap-1">
                        <ShoppingBag className="w-3.5 h-3.5" /> Browse Products
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeList.items.map((item) => (
                      <div key={item.id} className={`bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-center ${item.is_purchased ? "opacity-60" : ""}`}>
                        <Link href={`/listing/${item.product_id}`}>
                          <img src={item.image_url} alt={item.title} className="w-16 h-16 rounded-xl object-contain bg-muted shrink-0 cursor-pointer" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold line-clamp-1">{item.title}</p>
                          <p className="text-sm font-black text-primary mt-0.5">{formatNaira(item.price)}</p>
                          {item.is_purchased && (
                            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Purchased{item.purchased_by_name ? ` by ${item.purchased_by_name}` : ""}
                            </p>
                          )}
                        </div>
                        {!item.is_purchased && (
                          <button onClick={() => removeFromWishlist(activeList.id, item.product_id)} className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors shrink-0">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

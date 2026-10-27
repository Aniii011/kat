import { useState } from "react";
import { Link } from "wouter";
import { Check, Gift, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useWishlist } from "@/hooks/use-wishlist";

// "Add to wishlist": pick one or more of your wishlists for this product, or start a new one.
// Tapping a list again takes the product back out (unless a friend has already gifted it).
// Works for any signed-in user, and does NOT need a delivery address: the address is only
// needed later, to share the list.

export interface WishlistProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  inStock?: boolean;
}

const EMOJIS = ["🎁", "🎂", "💍", "🎄", "🏠", "👗"];

export default function AddToWishlistSheet({
  open,
  onClose,
  product,
  onNeedSignIn,
}: {
  open: boolean;
  onClose: () => void;
  product: WishlistProduct;
  onNeedSignIn?: () => void;
}) {
  const { user } = useAuth();
  const { wishlists, loading, createWishlist, addToWishlist, removeFromWishlist } = useWishlist(user?.id || null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState(EMOJIS[0]);

  if (!open) return null;

  const itemIn = (list: any) => (list.items || []).find((i: any) => i.product_id === product.id);

  const toggle = async (list: any) => {
    if (busy) return;
    const existing = itemIn(list);
    setMessage(null);
    if (existing?.is_purchased) {
      setMessage({ kind: "error", text: "A friend has already gifted this, so it can't be removed." });
      return;
    }
    setBusy(list.id);
    if (existing) {
      const res = await removeFromWishlist(list.id, product.id);
      setMessage(res.ok ? { kind: "ok", text: `Removed from ${list.name}` } : { kind: "error", text: res.error || "Could not remove it. Please try again." });
    } else {
      const res = await addToWishlist(list.id, product);
      setMessage(res.ok ? { kind: "ok", text: `Added to ${list.name}` } : { kind: "error", text: res.error || "Could not add it. Please try again." });
    }
    setBusy(null);
  };

  const createAndAdd = async () => {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy("new");
    setMessage(null);
    const created = await createWishlist(name, newEmoji);
    if (!created) {
      setMessage({ kind: "error", text: "Could not create the wishlist. Please try again." });
      setBusy(null);
      return;
    }
    const res = await addToWishlist(created.id, product);
    setMessage(res.ok ? { kind: "ok", text: `Added to ${name}` } : { kind: "error", text: res.error || "Created the list but could not add the item." });
    setNewName("");
    setCreating(false);
    setBusy(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" role="dialog" aria-label="Add to wishlist">
      <div className="bg-card border border-card-border rounded-3xl p-5 max-w-sm w-full shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <img src={product.imageUrl} alt="" className="w-12 h-12 rounded-xl object-contain bg-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base flex items-center gap-1.5"><Gift className="w-4 h-4 text-primary" /> Add to wishlist</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{product.title}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!user ? (
          <div className="text-center space-y-3 py-4">
            <p className="text-sm text-muted-foreground">Sign in to add this to a wishlist.</p>
            <Button className="rounded-full" onClick={() => { onClose(); onNeedSignIn?.(); }}>Sign in</Button>
          </div>
        ) : (
          <>
            {product.inStock === false && (
              <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2">
                This item is sold out right now. You can still add it, but friends can't gift it until it's back in stock.
              </p>
            )}

            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading your wishlists…</p>
            ) : (
              <div className="space-y-2">
                {wishlists.length === 0 && !creating && (
                  <p className="text-sm text-muted-foreground text-center py-2">You don't have a wishlist yet. Make your first one below.</p>
                )}
                {wishlists.map((list: any) => {
                  const inList = !!itemIn(list);
                  return (
                    <button
                      key={list.id}
                      onClick={() => toggle(list)}
                      disabled={busy !== null}
                      aria-pressed={inList}
                      className={`w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${inList ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                    >
                      <span className="text-xl">{list.emoji || "🎁"}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate">{list.name}</span>
                        <span className="block text-[11px] text-muted-foreground">{(list.items || []).length} item{(list.items || []).length === 1 ? "" : "s"}</span>
                      </span>
                      {busy === list.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : inList ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-primary"><Check className="w-3.5 h-3.5" /> Added</span>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">Add</span>
                      )}
                    </button>
                  );
                })}

                {creating ? (
                  <div className="rounded-2xl border border-border p-3 space-y-2">
                    <Input placeholder="Wishlist name (e.g. My birthday)" value={newName} onChange={(e) => setNewName(e.target.value)} className="rounded-xl h-10" autoFocus />
                    <div className="flex gap-1.5">
                      {EMOJIS.map((e) => (
                        <button key={e} type="button" onClick={() => setNewEmoji(e)} aria-label={`Emoji ${e}`}
                          className={`w-9 h-9 rounded-xl text-lg ${newEmoji === e ? "bg-primary/15 ring-2 ring-primary" : "bg-muted"}`}>{e}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-full flex-1" onClick={createAndAdd} disabled={!newName.trim() || busy !== null}>
                        {busy === "new" ? "Creating…" : "Create and add"}
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setCreating(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border p-3 text-sm font-semibold text-muted-foreground hover:border-primary/50">
                    <Plus className="w-4 h-4" /> Create a new wishlist
                  </button>
                )}
              </div>
            )}

            {message && (
              <p role="status" className={`text-xs rounded-xl px-3 py-2 ${message.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
                {message.text}
                {message.kind === "ok" && message.text.startsWith("Added") && (
                  <> · <Link href="/wishlists" className="underline font-semibold" onClick={onClose}>View my wishlists</Link></>
                )}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground text-center">You can add products before or after adding your delivery address. The address is only needed when you share the list.</p>
          </>
        )}
      </div>
    </div>
  );
                  }

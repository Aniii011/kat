import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  title: string;
  price: number;
  image_url: string;
  is_purchased: boolean;
  purchased_by_name?: string;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  delivery_name?: string;
  delivery_phone?: string;
  delivery_address?: string;
  is_public: boolean;
  created_at: string;
  items?: WishlistItem[];
}

export function useWishlist(userId: string | null) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlists = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("wishlists")
      .select("*, items:wishlist_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setWishlists(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchWishlists(); }, [fetchWishlists]);

  const createWishlist = async (name: string, emoji: string) => {
    if (!userId) return null;
    const { data } = await supabase
      .from("wishlists")
      .insert({ user_id: userId, name, emoji })
      .select()
      .single();
    if (data) setWishlists((prev) => [{ ...data, items: [] }, ...prev]);
    return data;
  };

  const deleteWishlist = async (wishlistId: string) => {
    await supabase.from("wishlists").delete().eq("id", wishlistId);
    setWishlists((prev) => prev.filter((w) => w.id !== wishlistId));
  };

  const updateWishlist = async (wishlistId: string, updates: Partial<Wishlist>) => {
    const { data } = await supabase
      .from("wishlists")
      .update(updates)
      .eq("id", wishlistId)
      .select()
      .single();
    if (data) setWishlists((prev) => prev.map((w) => w.id === wishlistId ? { ...w, ...data } : w));
    return data;
  };

  const addToWishlist = async (wishlistId: string, product: {
    id: string; title: string; price: number; imageUrl: string;
  }) => {
    const existing = wishlists
      .find((w) => w.id === wishlistId)
      ?.items?.find((i) => i.product_id === product.id);
    if (existing) return;

    const { data } = await supabase.from("wishlist_items").insert({
      wishlist_id: wishlistId,
      product_id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.imageUrl,
    }).select().single();

    if (data) {
      setWishlists((prev) => prev.map((w) =>
        w.id === wishlistId ? { ...w, items: [...(w.items || []), data] } : w
      ));
    }
  };

  const removeFromWishlist = async (wishlistId: string, productId: string) => {
    await supabase.from("wishlist_items")
      .delete()
      .eq("wishlist_id", wishlistId)
      .eq("product_id", productId);
    setWishlists((prev) => prev.map((w) =>
      w.id === wishlistId ? { ...w, items: (w.items || []).filter((i) => i.product_id !== productId) } : w
    ));
  };

  const isInWishlist = useCallback((productId: string) =>
    wishlists.some((w) => w.items?.some((i) => i.product_id === productId)),
    [wishlists]
  );

  const getWishlistsForProduct = useCallback((productId: string) =>
    wishlists.filter((w) => w.items?.some((i) => i.product_id === productId)),
    [wishlists]
  );

  return {
    wishlists, loading, fetchWishlists,
    createWishlist, deleteWishlist, updateWishlist,
    addToWishlist, removeFromWishlist,
    isInWishlist, getWishlistsForProduct,
  };
      }

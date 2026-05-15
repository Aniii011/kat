import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Listing, Review, Aesthetic } from "@/data/listings";

function rowToListing(row: Record<string, unknown>): Listing {
  return {
    id: row.id as number,
    title: row.title as string,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    discount: row.discount as number | undefined,
    category: row.category as string,
    description: row.description as string,
    brand: row.brand as string | undefined,
    imageUrl: row.image_url as string,
    images: (row.images as string[]) ?? [],
    rating: Number(row.rating),
    reviewCount: row.review_count as number,
    reviews: [],
    sold: row.sold as number,
    inStock: row.in_stock as boolean,
    stockCount: row.stock_count as number,
    freeShipping: row.free_shipping as boolean,
    shippingDays: row.shipping_days as number,
    sellerName: row.seller_name as string,
    sellerAvatar: row.seller_avatar as string | undefined,
    sellerRating: Number(row.seller_rating),
    sellerFollowers: row.seller_followers as number | undefined,
    isVerifiedSeller: row.is_verified_seller as boolean,
    badge: row.badge as Listing["badge"] | undefined,
    colors: (row.colors as string[]) ?? undefined,
    clothingSizes: (row.clothing_sizes as string[]) ?? undefined,
    shoeSizes: (row.shoe_sizes as string[]) ?? undefined,
    aesthetics: (row.aesthetics as Aesthetic[]) ?? undefined,
    isThrift: (row.is_thrift as boolean) ?? false,
    depositAmount: row.deposit_amount ? Number(row.deposit_amount) : undefined,
    isFeatured: (row.is_featured as boolean) ?? false,
    tags: (row.tags as string[]) ?? undefined,
  };
}

function rowToReview(row: Record<string, unknown>): Review {
  return {
    id: row.id as number,
    author: row.author as string,
    avatar: row.avatar as string,
    rating: row.rating as number,
    date: row.date as string,
    title: row.title as string,
    body: row.body as string,
    verified: row.verified as boolean,
  };
}

export function useListings(filters?: { category?: string; aesthetic?: string; isThrift?: boolean; search?: string }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      setError(null);
      let query = supabase.from("listings").select("*").order("id");
      if (filters?.isThrift !== undefined) {
        query = query.eq("is_thrift", filters.isThrift);
      }
      if (filters?.category && filters.category !== "All") {
        query = query.eq("category", filters.category);
      }
      const { data, error } = await query;
      if (error) {
        setError(error.message);
      } else {
        setListings((data ?? []).map(rowToListing));
      }
      setLoading(false);
    }
    fetchListings();
  }, [filters?.category, filters?.isThrift, filters?.aesthetic, filters?.search]);

  return { listings, loading, error };
}

export function useListing(id: number | null) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchListing() {
      setLoading(true);
      setError(null);
      const [listingRes, reviewsRes] = await Promise.all([
        supabase.from("listings").select("*").eq("id", id).single(),
        supabase.from("reviews").select("*").eq("listing_id", id).order("id"),
      ]);
      if (listingRes.error) {
        setError(listingRes.error.message);
        setLoading(false);
        return;
      }
      const parsed = rowToListing(listingRes.data as Record<string, unknown>);
      parsed.reviews = (reviewsRes.data ?? []).map((r) => rowToReview(r as Record<string, unknown>));
      setListing(parsed);
      setLoading(false);
    }
    fetchListing();
  }, [id]);

  return { listing, loading, error };
}

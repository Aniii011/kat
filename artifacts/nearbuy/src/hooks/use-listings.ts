import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Listing, Review } from "@/data/listings";

function rowToListing(row: Record<string, unknown>): Listing {
  return {
    id: row.id as number,
    title: row.title as string,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    discount: row.discount as number | undefined,
    category: row.category as string,
    description: row.description as string,
    location: row.location as string,
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
    sellerRating: Number(row.seller_rating),
    isVerifiedSeller: row.is_verified_seller as boolean,
    badge: row.badge as Listing["badge"] | undefined,
    colors: (row.colors as string[]) ?? undefined,
    sizes: (row.sizes as string[]) ?? undefined,
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

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("id");
      if (error) {
        setError(error.message);
      } else {
        setListings((data ?? []).map(rowToListing));
      }
      setLoading(false);
    }
    fetchListings();
  }, []);

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
      parsed.reviews = (reviewsRes.data ?? []).map(r => rowToReview(r as Record<string, unknown>));
      setListing(parsed);
      setLoading(false);
    }
    fetchListing();
  }, [id]);

  return { listing, loading, error };
}

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Listing, Review, Aesthetic } from "@/data/listings";

function rowToListing(row: Record<string, unknown>): Listing {
  return {
    id: row.id as string,
    title: (row.title as string) ?? "",
    price: Number(row.price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    discount: row.discount as number | undefined,
    category: (row.category as string) ?? "",
    description: (row.description as string) ?? "",
    brand: row.brand as string | undefined,
    imageUrl: (row.image_url as string) ?? "",
    images: (row.images as string[]) ?? [],
    rating: Number(row.rating) || 0,
    reviewCount: (row.review_count as number) ?? 0,
    reviews: [],
    sold: (row.sold as number) ?? 0,
    inStock: (row.in_stock as boolean) ?? true,
    stockCount: (row.stock_count as number) ?? 0,
    freeShipping: (row.free_shipping as boolean) ?? false,
    shippingDays: (row.shipping_days as number) ?? 3,
    sellerName: (row.seller_name as string) ?? "",
    sellerId: (row.seller_id as string) ?? undefined,
    sellerAvatar: row.seller_avatar as string | undefined,
    sellerRating: Number(row.seller_rating) || 0,
    sellerFollowers: row.seller_followers as number | undefined,
    isVerifiedSeller: (row.is_verified_seller as boolean) ?? false,
    badge: row.badge as Listing["badge"] | undefined,
    colors: (row.colors as string[]) ?? undefined,
    clothingSizes: (row.clothing_sizes as string[]) ?? undefined,
    shoeSizes: (row.shoe_sizes as string[]) ?? undefined,
    aesthetics: (row.aesthetics as Aesthetic[]) ?? undefined,
    isThrift: (row.is_thrift as boolean) ?? false,
    depositAmount: row.deposit_amount ? Number(row.deposit_amount) : undefined,
    isFeatured: (row.is_featured as boolean) ?? false,
    tags: (row.tags as string[]) ?? undefined,
    colorImages: (row.color_images as Record<string, string>) ?? undefined,
    customSizeNote: (row.custom_size_note as string) ?? undefined,
        attributes: (row.attributes as Record<string, unknown>) ?? {},
    variants: (row.variants as any[]) ?? undefined,
  };
}

function rowToReview(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    author: row.author as string,
    avatar: row.avatar as string,
    rating: row.rating as number,
    date: row.date as string,
    title: row.title as string,
    body: row.body as string,
    verified: row.verified as boolean,
  };
}

export function useListings(filters?: {
  category?: string;
  aesthetic?: string;
  isThrift?: boolean;
  search?: string;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("products")
        .select("*")
        // FIX (root cause of drafts appearing on buyer-facing surfaces):
        // this query previously had no status filter at all, so every row
        // in `products` was returned — including rows Seller.tsx saves with
        // status: "draft" via saveProduct("draft"). Excluding "draft" here,
        // at the shared data-access layer, is what actually enforces
        // "seller draft = never buyer-visible" for every consumer of this
        // hook (Home, and anything else built on useListings/useListing),
        // rather than patching it per-screen after the fact.
        //
        // Using .neq("status", "draft") rather than .eq("status", "published")
        // deliberately: Seller.tsx's saveProduct() only ever writes "draft"
        // or "published" to this column, but if a null/undefined status
        // value exists on any older row (e.g. rows created before this
        // field existed), .eq("status","published") would incorrectly hide
        // it from buyers too. .neq() only excludes rows explicitly marked
        // draft and lets everything else through unchanged.
        .neq("status", "draft")
        .order("created_at", { ascending: false });

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

export function useListing(id: string | null) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchListing() {
      setLoading(true);
      setError(null);

      const [listingRes, reviewsRes] = await Promise.all([
        // FIX: same gap as useListings above — a draft product's direct URL
        // (/listing/:id) was fully viewable by any buyer since this query
        // had no status filter either. Excluding drafts here closes that
        // surface too (product detail pages, and anything that links
        // directly to a listing by id rather than going through the list
        // query above).
        supabase.from("products").select("*").eq("id", id).neq("status", "draft").single(),
        supabase.from("reviews").select("*").eq("product_id", id).order("id"),
      ]);

      if (listingRes.error) {
        // A draft (or a genuinely missing product) now surfaces as a normal
        // "not found" error here rather than a distinct case — that's the
        // correct behavior for a buyer hitting a draft's URL directly: it
        // should look exactly like a product that doesn't exist, not reveal
        // that a hidden draft exists at that id.
        setError(listingRes.error.message);
        setLoading(false);
        return;
      }

      const parsed = rowToListing(listingRes.data as Record<string, unknown>);
      parsed.reviews = (reviewsRes.data ?? []).map((r) =>
        rowToReview(r as Record<string, unknown>)
      );
      setListing(parsed);
      setLoading(false);
    }

    fetchListing();
  }, [id]);

  return { listing, loading, error };
        }

import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListings } from "@/hooks/use-listings";
import { Search, Star, Heart, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["All", "Furniture", "Electronics", "Sports", "Clothing", "Books", "Vehicles", "Other"];

const BADGE_STYLES: Record<string, string> = {
  "Best Seller": "bg-amber-500 text-white",
  "Hot Deal": "bg-rose-500 text-white",
  "New": "bg-emerald-500 text-white",
};

function StarRow({ rating, count, size = "sm" }: { rating: number; count: number; size?: "sm" | "xs" }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.floor(rating);
    const half = !filled && i < rating;
    return { filled, half };
  });
  const iconSize = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {stars.map((s, i) => (
          <Star
            key={i}
            className={`${iconSize} ${s.filled || s.half ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`}
          />
        ))}
      </div>
      <span className={`text-muted-foreground ${size === "xs" ? "text-[10px]" : "text-xs"}`}>
        ({count.toLocaleString()})
      </span>
    </div>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const { listings, loading, error } = useListings();

  const filteredListings = useMemo(() => {
    let result = listings.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q);
      const matchesCat = selectedCategory === "All" || l.category === selectedCategory;
      return matchesSearch && matchesCat;
    });

    if (sortBy === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
    else if (sortBy === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "discount") result = [...result].sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));

    return result;
  }, [searchQuery, selectedCategory, sortBy]);

  const toggleWishlist = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-xs text-center py-2 font-medium tracking-wide">
        🚚 Free shipping on orders over $50 &nbsp;·&nbsp; Secure checkout &nbsp;·&nbsp; Easy 30-day returns
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/" className="shrink-0 flex items-center gap-1.5">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">Near<span className="text-primary">Buy</span></span>
          </Link>
          <div className="relative flex-1 max-w-xl mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="search"
              placeholder="Search products…"
              className="pl-10 h-10 bg-gray-100 border-0 rounded-full focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-white transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
            <Heart className="h-5 w-5 text-gray-600" />
            {wishlist.size > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {wishlist.size}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Category navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-none py-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-2.5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/4 mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Couldn't load products</h3>
            <p className="text-sm text-gray-500 max-w-xs">{error}</p>
          </div>
        )}

        {/* Toolbar + grid */}
        {!loading && !error && (
          <>
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{filteredListings.length}</span> products
                {selectedCategory !== "All" && <> in <span className="font-medium text-gray-800">{selectedCategory}</span></>}
                {searchQuery && <> for "<span className="font-medium text-gray-800">{searchQuery}</span>"</>}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                    <SelectItem value="discount">Biggest Discount</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product grid */}
            {filteredListings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {filteredListings.map((listing) => (
                  <Link key={listing.id} href={`/listing/${listing.id}`} className="group block">
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full">
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {listing.badge && (
                          <div className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${BADGE_STYLES[listing.badge]}`}>
                            {listing.badge}
                          </div>
                        )}
                        {listing.discount && !listing.badge && (
                          <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            -{listing.discount}%
                          </div>
                        )}
                        <button
                          onClick={(e) => toggleWishlist(e, listing.id)}
                          className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                        >
                          <Heart className={`h-3.5 w-3.5 transition-colors ${wishlist.has(listing.id) ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                        </button>
                        {listing.freeShipping && (
                          <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5" /> Free ship
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col gap-1.5 flex-1">
                        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{listing.category}</p>
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {listing.title}
                        </h3>
                        <StarRow rating={listing.rating} count={listing.reviewCount} size="xs" />
                        <div className="mt-auto pt-1.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-extrabold text-gray-900">${listing.price.toLocaleString()}</span>
                            {listing.originalPrice && (
                              <span className="text-xs text-gray-400 line-through">${listing.originalPrice.toLocaleString()}</span>
                            )}
                          </div>
                          {listing.discount && (
                            <span className="text-[10px] font-semibold text-emerald-600">{listing.discount}% off</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">No products found</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-xs">Try different keywords or browse another category.</p>
                <Button onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }} className="rounded-full px-6">
                  Clear filters
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          <p className="font-semibold text-gray-700 mb-1">NearBuy Marketplace</p>
          <p>© {new Date().getFullYear()} All rights reserved · Secure payments · 30-day returns</p>
        </div>
      </footer>
    </div>
  );
}

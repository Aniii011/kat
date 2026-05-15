import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListings } from "@/hooks/use-listings";
import { listings as staticListings, CATEGORIES, AESTHETICS, type Listing } from "@/data/listings";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  Search, Heart, ShoppingBag, Star, BadgeCheck, Flame,
  Sparkles, ChevronRight, Truck, RefreshCw, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const BADGE_STYLES: Record<string, string> = {
  "Best Seller": "bg-amber-500 text-white",
  "Hot Deal": "bg-rose-500 text-white",
  "New": "bg-emerald-500 text-white",
  "Trending": "bg-violet-500 text-white",
  "Limited": "bg-purple-600 text-white",
};

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
          />
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground">({count})</span>
    </div>
  );
}

function ProductCard({ listing, wishlisted, onWishlist }: {
  listing: Listing;
  wishlisted: boolean;
  onWishlist: (e: React.MouseEvent) => void;
}) {
  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="product-card group relative flex flex-col rounded-2xl overflow-hidden bg-card border border-card-border shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="product-img w-full h-full object-cover"
            loading="lazy"
          />
          {listing.badge && (
            <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide ${BADGE_STYLES[listing.badge] ?? "bg-gray-500 text-white"}`}>
              {listing.badge}
            </span>
          )}
          {listing.isThrift && (
            <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500 text-white">
              Thrift 💜
            </span>
          )}
          <button
            onClick={onWishlist}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${wishlisted ? "bg-primary" : "bg-white/90 hover:bg-white"}`}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-white text-white" : "text-gray-500"}`} />
          </button>
          {listing.discount && (
            <span className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
              -{listing.discount}%
            </span>
          )}
          {listing.freeShipping && (
            <span className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/90 text-white font-medium">
              Free Delivery
            </span>
          )}
        </div>

        <div className="p-3 flex flex-col flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <p className="text-[11px] text-muted-foreground truncate flex-1">{listing.sellerName}</p>
            {listing.isVerifiedSeller && <BadgeCheck className="w-3 h-3 text-primary shrink-0" />}
          </div>
          <p className="text-sm font-semibold leading-tight line-clamp-2 flex-1">{listing.title}</p>
          <StarRow rating={listing.rating} count={listing.reviewCount} />

          {listing.aesthetics && listing.aesthetics.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {listing.aesthetics.slice(0, 2).map((a) => (
                <span key={a} className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-medium">{a}</span>
              ))}
            </div>
          )}

          {listing.colors && listing.colors.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {listing.colors.slice(0, 3).map((c) => (
                <span key={c} className="text-[9px] border border-border rounded-full px-1.5 py-0.5 text-muted-foreground">{c}</span>
              ))}
              {listing.colors.length > 3 && (
                <span className="text-[9px] text-muted-foreground self-center">+{listing.colors.length - 3}</span>
              )}
            </div>
          )}

          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-bold text-primary text-sm">{formatNaira(listing.price)}</span>
            {listing.originalPrice && (
              <span className="text-[11px] text-muted-foreground line-through">{formatNaira(listing.originalPrice)}</span>
            )}
          </div>

          {listing.isThrift && listing.depositAmount && (
            <p className="text-[10px] text-purple-500 mt-1 font-semibold">
              Deposit {formatNaira(listing.depositAmount)} to secure
            </p>
          )}

          {listing.sold > 0 && !listing.isThrift && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{listing.sold} sold</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-card-border">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAesthetic, setSelectedAesthetic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [searchFocused, setSearchFocused] = useState(false);

  const { listings: remoteListings, loading, error } = useListings();
  const allListings = remoteListings.length > 0 ? remoteListings : staticListings;
  const regularListings = allListings.filter((l) => !l.isThrift);
  const thriftListings = allListings.filter((l) => l.isThrift);

  const filteredListings = useMemo(() => {
    let result = regularListings.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.sellerName.toLowerCase().includes(q) ||
        l.tags?.some((t) => t.toLowerCase().includes(q));
      const matchesCat = selectedCategory === "All" || l.category === selectedCategory;
      const matchesAesthetic =
        !selectedAesthetic ||
        (l.aesthetics ?? []).includes(selectedAesthetic as import("@/data/listings").Aesthetic);
      return matchesSearch && matchesCat && matchesAesthetic;
    });

    if (sortBy === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
    else if (sortBy === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "discount") result = [...result].sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    else if (sortBy === "featured") result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

    return result;
  }, [searchQuery, selectedCategory, selectedAesthetic, sortBy, regularListings]);

  const toggleWishlist = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const displayedCategories = CATEGORIES.slice(0, 20);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Announcement bar ─────────────────────────────── */}
      <div className="bg-primary text-primary-foreground text-center text-[11px] sm:text-xs py-2 px-4 font-medium tracking-wide">
        🚚 Free delivery on orders over ₦25,000 &nbsp;·&nbsp; 💳 Pay on delivery available &nbsp;·&nbsp; ✨ 100% authentic
      </div>

      {/* ── Top nav ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/">
            <span className="text-2xl font-black tracking-tight text-primary select-none cursor-pointer">
              dripp<span className="text-foreground">.</span>
            </span>
          </Link>

          <div className={`flex-1 relative transition-all duration-200 ${searchFocused ? "max-w-2xl" : "max-w-lg"} mx-auto`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search clothes, beauty, wigs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="pl-9 pr-4 h-9 rounded-full bg-muted border-transparent focus:border-primary text-sm"
            />
          </div>

          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <Button variant="ghost" size="icon" className="relative w-9 h-9 rounded-full">
              <Heart className="w-4.5 h-4.5" />
              {wishlist.size > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.size}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ShoppingBag className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>

        {/* Category pills */}
        <div className="border-t border-border/50">
          <div className="flex gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide max-w-7xl mx-auto">
            {displayedCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-24">
        {/* ── Hero ─────────────────────────────────────── */}
        {!searchQuery && selectedCategory === "All" && !selectedAesthetic && (
          <div className="mt-4 mb-6 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/30 border border-primary/20 p-6 sm:p-10 relative">
            <div className="relative z-10 max-w-lg">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                <Flame className="w-3 h-3" /> New drops every week
              </span>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight text-foreground">
                Slay different.<br />
                <span className="text-primary">Shop Nigerian.</span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-sm">
                Fashion, beauty, and lifestyle — curated for the modern Nigerian woman who drips with style.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                <Button size="sm" className="rounded-full gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> Shop Now
                </Button>
                <Link href="/thrift-drops">
                  <Button variant="outline" size="sm" className="rounded-full font-semibold border-primary text-primary hover:bg-primary/10">
                    💜 Thrift Drops
                  </Button>
                </Link>
              </div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none hidden sm:flex items-center justify-center">
              <span className="text-[120px] select-none">✨</span>
            </div>
          </div>
        )}

        {/* ── Shop by Vibe ──────────────────────────── */}
        {!searchQuery && selectedCategory === "All" && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">✨ Shop by Vibe</h2>
              {selectedAesthetic && (
                <button
                  onClick={() => setSelectedAesthetic(null)}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {AESTHETICS.map(({ label, emoji }) => (
                <button
                  key={label}
                  onClick={() => setSelectedAesthetic(selectedAesthetic === label ? null : label)}
                  className={`shrink-0 flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-semibold border transition-all duration-150 whitespace-nowrap ${
                    selectedAesthetic === label
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Sort + Results count ─────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${filteredListings.length} item${filteredListings.length !== 1 ? "s" : ""}`}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs bg-muted border border-border rounded-full px-3 py-1.5 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="featured">Featured</option>
            <option value="rating">Top Rated</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="discount">Biggest Discount</option>
          </select>
        </div>

        {/* ── Products Grid ────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-destructive" />
            </div>
            <p className="font-semibold text-base">Couldn't load products</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-base">No items found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different category or search term</p>
            <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setSelectedAesthetic(null); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredListings.map((listing) => (
              <ProductCard
                key={listing.id}
                listing={listing}
                wishlisted={wishlist.has(listing.id)}
                onWishlist={(e) => toggleWishlist(e, listing.id)}
              />
            ))}
          </div>
        )}

        {/* ── Thrift Drops Preview ────────────────── */}
        {!searchQuery && thriftListings.length > 0 && (
          <section className="mt-12 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black">💜 Thrift Drops</h2>
                <p className="text-xs text-muted-foreground mt-0.5">One-of-one vintage & pre-loved pieces — deposit to secure</p>
              </div>
              <Link href="/thrift-drops">
                <Button variant="outline" size="sm" className="rounded-full gap-1 text-xs font-semibold border-purple-300 text-purple-500 hover:bg-purple-50">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {thriftListings.slice(0, 3).map((listing) => (
                <ProductCard
                  key={listing.id}
                  listing={listing}
                  wishlisted={wishlist.has(listing.id)}
                  onWishlist={(e) => toggleWishlist(e, listing.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Trust badges ────────────────────────── */}
        <div className="mt-10 mb-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: <Truck className="w-5 h-5 text-primary" />, title: "Fast Delivery", sub: "Nationwide shipping" },
            { icon: <RefreshCw className="w-5 h-5 text-primary" />, title: "Easy Returns", sub: "14-day return policy" },
            { icon: <Shield className="w-5 h-5 text-primary" />, title: "Buyer Protection", sub: "Safe & secure payments" },
          ].map((b) => (
            <div key={b.title} className="bg-card border border-card-border rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">{b.icon}</div>
              <p className="text-xs font-bold">{b.title}</p>
              <p className="text-[10px] text-muted-foreground">{b.sub}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-4 text-center">
        <p className="text-2xl font-black text-primary tracking-tight">dripp.</p>
        <p className="text-xs text-muted-foreground mt-1">Nigeria's favourite fashion & lifestyle marketplace</p>
        <p className="text-xs text-muted-foreground mt-4">© 2025 Dripp Marketplace · Made with 💕 for Nigerian girlies</p>
      </footer>
    </div>
  );
}

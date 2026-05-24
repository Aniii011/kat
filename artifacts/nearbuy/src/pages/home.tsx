import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListings } from "@/hooks/use-listings";
import {
  listings as staticListings, AESTHETICS, TOP_CATEGORIES, SUBCATEGORIES,
  CATEGORY_TO_TOP, type Listing, type TopCategory,
} from "@/data/listings";
import { useBoards } from "@/hooks/use-boards";
import ThemeSwitcher from "@/components/theme-switcher";
import QuickViewModal from "@/components/quick-view-modal";
import SaveToBoardModal from "@/components/save-to-board-modal";
import {
  Search, ShoppingBag, Star, BadgeCheck, Flame, Sparkles,
  ChevronRight, Bookmark, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

const BADGE_STYLES: Record<string, string> = {
  "Best Seller": "bg-amber-500 text-white",
  "Hot Deal":    "bg-rose-500 text-white",
  "New":         "bg-emerald-500 text-white",
  "Trending":    "bg-violet-500 text-white",
  "Limited":     "bg-purple-600 text-white",
};

// ── Clean product card (uniform, commerce-style) ─────────────
function ProductCard({
  listing, index, onQuickView, onSave, saved,
}: {
  listing: Listing; index: number;
  onQuickView: (l: Listing) => void;
  onSave: (e: React.MouseEvent, l: Listing) => void;
  saved: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.35), duration: 0.28 }}
    >
      <div
        className="group bg-card rounded-2xl overflow-hidden cursor-pointer border border-border hover:shadow-md transition-all duration-300"
        onClick={() => onQuickView(listing)}
      >
        {/* Image — fixed aspect ratio for clean grid alignment */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Top-left badge */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {listing.isThrift && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-purple-500 text-white leading-tight">
                Thrift 💜
              </span>
            )}
            {listing.badge && !listing.isThrift && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold leading-tight ${BADGE_STYLES[listing.badge] ?? "bg-gray-500 text-white"}`}>
                {listing.badge}
              </span>
            )}
          </div>

          {/* Discount chip bottom-left */}
          {listing.discount && (
            <span className="absolute bottom-2 left-2 text-[9px] px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground font-bold">
              -{listing.discount}%
            </span>
          )}

          {/* Wishlist button top-right */}
          <motion.button
            onClick={(e) => onSave(e, listing)}
            whileTap={{ scale: 0.8 }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all ${
              saved
                ? "bg-primary shadow-primary/30"
                : "bg-white/90 hover:bg-white"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${saved ? "fill-white text-white" : "text-gray-700"}`}
            />
          </motion.button>

          {/* Quick view overlay on hover (desktop only) */}
          <div className="absolute inset-x-0 bottom-0 hidden sm:flex justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="bg-background/90 backdrop-blur-sm text-foreground text-[11px] font-semibold px-3 py-1.5 rounded-full shadow">
              Quick View
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-2.5 space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground truncate flex-1 leading-tight">
              {listing.sellerName}
            </span>
            {listing.isVerifiedSeller && (
              <BadgeCheck className="w-3 h-3 text-primary shrink-0" />
            )}
          </div>

          <p className="text-[12px] font-semibold leading-snug line-clamp-2 text-foreground">
            {listing.title}
          </p>

          {listing.aesthetics && listing.aesthetics.length > 0 && (
            <span className="inline-block text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-md font-medium">
              {listing.aesthetics[0]}
            </span>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-[13px] font-extrabold text-primary leading-none">
                {formatNaira(listing.price)}
              </span>
              {listing.originalPrice && (
                <span className="text-[10px] text-muted-foreground line-through leading-none">
                  {formatNaira(listing.originalPrice)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-medium text-muted-foreground">
                {listing.rating}
              </span>
            </div>
          </div>

          {listing.isThrift && listing.depositAmount && (
            <p className="text-[9px] text-purple-500 font-semibold leading-tight">
              Deposit {formatNaira(listing.depositAmount)} to hold
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-2.5 space-y-1.5">
        <Skeleton className="h-2.5 w-20 rounded-full" />
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-3/4 rounded-full" />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
export default function Home() {
  const [topCategory, setTopCategory] = useState<TopCategory | "All">("All");
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [selectedAesthetic, setSelectedAesthetic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [quickViewListing, setQuickViewListing] = useState<Listing | null>(null);
  const [saveTarget, setSaveTarget] = useState<Listing | null>(null);

  const { listings: remoteListings, loading } = useListings();
  const allListings = remoteListings.length > 0 ? remoteListings : staticListings;
  const { isSaved } = useBoards();

  const subcats =
    topCategory !== "All" ? (SUBCATEGORIES[topCategory as TopCategory] ?? []) : [];

  const filteredListings = useMemo(() => {
    let result = allListings.filter((l) => {
      if (topCategory === "Thrift") return l.isThrift;
      if (topCategory === "Deals")  return !l.isThrift && (l.discount ?? 0) > 0;

      const matchesSub = !subCategory ||
        l.category === subCategory ||
        l.category.toLowerCase().includes(subCategory.toLowerCase());

      const matchesTop =
        topCategory === "All" ||
        (!l.isThrift && (
          CATEGORY_TO_TOP[l.category] === topCategory ||
          (SUBCATEGORIES[topCategory as TopCategory] ?? []).some(
            (s) => l.category.toLowerCase() === s.toLowerCase()
          )
        ));

      const matchesAesthetic =
        !selectedAesthetic ||
        (l.aesthetics ?? []).some((a) => a === selectedAesthetic);

      return matchesSub && matchesTop && matchesAesthetic && !l.isThrift;
    });

    if (sortBy === "price-asc")  result = [...result].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
    else if (sortBy === "rating")     result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "discount")   result = [...result].sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    else result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    return result;
  }, [topCategory, subCategory, selectedAesthetic, sortBy, allListings]);

  const thriftPreview = allListings.filter((l) => l.isThrift).slice(0, 3);

  const handleSave = (e: React.MouseEvent, listing: Listing) => {
    e.stopPropagation();
    setSaveTarget(listing);
  };

  const selectTop = (cat: TopCategory | "All") => {
    setTopCategory(cat);
    setSubCategory(null);
    setSelectedAesthetic(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Announcement bar */}
      <div className="bg-primary text-primary-foreground text-center text-[11px] py-2 px-4 font-medium tracking-wide shrink-0">
        🚚 Free delivery over ₦25,000 &nbsp;·&nbsp; 💳 Pay on delivery &nbsp;·&nbsp; ✨ 100% authentic
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo */}
          <Link href="/">
            <span className="text-2xl font-black tracking-tight text-primary cursor-pointer select-none">
              KAT
            </span>
          </Link>

          {/* Search bar */}
          <Link href="/search" className="flex-1 max-w-lg mx-auto">
            <div className="flex items-center gap-2 h-9 rounded-full bg-muted px-4 text-muted-foreground text-sm cursor-pointer hover:bg-accent transition-colors">
              <Search className="w-4 h-4 shrink-0" />
              <span>Search KAT...</span>
            </div>
          </Link>

          {/* Header actions */}
          <div className="flex items-center gap-0.5">
            <ThemeSwitcher />
            <Link href="/boards">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full" title="My Boards">
                <Bookmark className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
                <ShoppingBag className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Top-level category strip */}
        <div className="border-t border-border/40">
          <div className="flex overflow-x-auto scrollbar-hide max-w-7xl mx-auto px-3 py-2 gap-1">
            <button
              onClick={() => selectTop("All")}
              className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                topCategory === "All"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {TOP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => selectTop(cat)}
                className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                  topCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : cat === "Thrift"
                    ? "text-primary/80 hover:text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "Thrift" ? "💜 Thrift" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategory strip */}
        <AnimatePresence>
          {subcats.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/30 overflow-hidden"
            >
              <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-hide max-w-7xl mx-auto">
                {subcats.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSubCategory(subCategory === sub ? null : sub)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap ${
                      subCategory === sub
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-background"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pb-28">

        {/* Hero — only on All/no-filter */}
        {topCategory === "All" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 mb-5 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/30 border border-primary/15 p-5 sm:p-10 relative"
          >
            <div className="relative z-10 max-w-lg">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                <Flame className="w-3 h-3" /> New drops every week
              </span>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
                Fashion.<br />
                <span className="text-primary">Curated for you.</span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-sm">
                Discover fashion, beauty & lifestyle — browse, save, and shop with KAT.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                <Button size="sm" className="rounded-full gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> Shop Now
                </Button>
                <Link href="/thrift-drops">
                  <Button variant="outline" size="sm" className="rounded-full font-semibold border-primary/50 text-primary hover:bg-primary/10">
                    💜 Thrift Drops
                  </Button>
                </Link>
              </div>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[72px] opacity-10 pointer-events-none hidden sm:block select-none">
              ✨
            </div>
          </motion.div>
        )}

        {/* Deals banner */}
        {topCategory === "Deals" && (
          <div className="mt-4 mb-5 rounded-3xl bg-gradient-to-r from-rose-500 to-orange-400 p-5 text-white">
            <p className="text-2xl font-black">🔥 Deals & Offers</p>
            <p className="text-sm opacity-90 mt-1">Up to 35% off selected items</p>
          </div>
        )}

        {/* Aesthetic filter pills */}
        {topCategory === "All" && (
          <section className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold">✨ Shop by Vibe</h2>
              {selectedAesthetic && (
                <button
                  onClick={() => setSelectedAesthetic(null)}
                  className="text-xs text-primary font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {AESTHETICS.map(({ label, emoji }) => (
                <button
                  key={label}
                  onClick={() =>
                    setSelectedAesthetic(selectedAesthetic === label ? null : label)
                  }
                  className={`shrink-0 flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full font-semibold border transition-all whitespace-nowrap ${
                    selectedAesthetic === label
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Sort + count bar */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">
            {loading
              ? "Loading..."
              : `${filteredListings.length} item${filteredListings.length !== 1 ? "s" : ""}`}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs bg-muted border border-border rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="featured">Featured</option>
            <option value="rating">Top Rated</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="discount">Best Deal</option>
          </select>
        </div>

        {/* ── Product grid (clean, uniform) ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-bold text-base">No items found</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5 rounded-full"
              onClick={() => { selectTop("All"); setSelectedAesthetic(null); }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredListings.map((listing, i) => (
              <ProductCard
                key={listing.id}
                listing={listing}
                index={i}
                onQuickView={setQuickViewListing}
                onSave={handleSave}
                saved={isSaved(listing.id)}
              />
            ))}
          </div>
        )}

        {/* Thrift preview section */}
        {topCategory === "All" && thriftPreview.length > 0 && (
          <section className="mt-12 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black">💜 Thrift Drops</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  One-of-one vintage & pre-loved — deposit to hold
                </p>
              </div>
              <Link href="/thrift-drops">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1 text-xs font-semibold border-purple-300 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {thriftPreview.map((listing, i) => (
                <ProductCard
                  key={listing.id}
                  listing={listing}
                  index={i}
                  onQuickView={setQuickViewListing}
                  onSave={handleSave}
                  saved={isSaved(listing.id)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <QuickViewModal
        listing={quickViewListing}
        onClose={() => setQuickViewListing(null)}
      />
      {saveTarget && (
        <SaveToBoardModal
          open={!!saveTarget}
          onClose={() => setSaveTarget(null)}
          listingId={saveTarget.id}
          listingTitle={saveTarget.title}
        />
      )}
    </div>
  );
}

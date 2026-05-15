import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListings } from "@/hooks/use-listings";
import { listings as staticListings, CATEGORIES, AESTHETICS, type Listing } from "@/data/listings";
import { useBoards } from "@/hooks/use-boards";
import ThemeSwitcher from "@/components/theme-switcher";
import QuickViewModal from "@/components/quick-view-modal";
import SaveToBoardModal from "@/components/save-to-board-modal";
import {
  Search, Heart, ShoppingBag, Star, BadgeCheck, Flame,
  Sparkles, ChevronRight, Bookmark, Recycle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// ── Helpers ────────────────────────────────────────────────
function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function aspectClass(id: number) {
  const r = id % 5;
  if (r === 0) return "aspect-square";
  if (r === 1) return "aspect-[3/4]";
  if (r === 2) return "aspect-[2/3]";
  if (r === 3) return "aspect-[4/5]";
  return "aspect-[3/5]";
}

const BADGE_STYLES: Record<string, string> = {
  "Best Seller": "bg-amber-500 text-white",
  "Hot Deal": "bg-rose-500 text-white",
  "New": "bg-emerald-500 text-white",
  "Trending": "bg-violet-500 text-white",
  "Limited": "bg-purple-600 text-white",
};

// ── Pinterest masonry card ─────────────────────────────────
function MasonryCard({
  listing,
  index,
  onQuickView,
  onSave,
  saved,
}: {
  listing: Listing;
  index: number;
  onQuickView: (l: Listing) => void;
  onSave: (e: React.MouseEvent, l: Listing) => void;
  saved: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.35 }}
      className="break-inside-avoid mb-3"
    >
      <div
        className="group relative bg-card rounded-2xl overflow-hidden cursor-pointer border border-card-border hover:shadow-lg transition-shadow duration-300"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onQuickView(listing)}
      >
        {/* Image */}
        <div className={`relative ${aspectClass(listing.id)} overflow-hidden bg-muted`}>
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Top overlays */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {listing.isThrift && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-purple-500 text-white leading-4">Thrift 💜</span>
            )}
            {listing.badge && !listing.isThrift && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold leading-4 ${BADGE_STYLES[listing.badge] ?? "bg-gray-500 text-white"}`}>
                {listing.badge}
              </span>
            )}
          </div>

          {listing.discount && (
            <span className="absolute bottom-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
              -{listing.discount}%
            </span>
          )}

          {/* Save button */}
          <motion.button
            onClick={(e) => onSave(e, listing)}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
              saved ? "bg-primary" : "bg-white/90 hover:bg-white"
            }`}
            whileTap={{ scale: 0.85 }}
            animate={{ opacity: hovered || saved ? 1 : 0.7 }}
          >
            <Heart className={`w-3.5 h-3.5 ${saved ? "fill-white text-white" : "text-gray-600"}`} />
          </motion.button>

          {/* Quick view hover overlay (desktop) */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-black/30 hidden sm:flex items-end justify-center pb-3"
              >
                <span className="bg-background/95 text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                  Quick View
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info below image */}
        <div className="p-2.5">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px] text-muted-foreground truncate flex-1">{listing.sellerName}</span>
            {listing.isVerifiedSeller && <BadgeCheck className="w-2.5 h-2.5 text-primary shrink-0" />}
          </div>
          <p className="text-xs font-semibold leading-tight line-clamp-2">{listing.title}</p>

          {listing.aesthetics && listing.aesthetics.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {listing.aesthetics.slice(0, 1).map((a) => (
                <span key={a} className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-medium">{a}</span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-1.5">
            <div>
              <span className="text-xs font-black text-primary">{formatNaira(listing.price)}</span>
              {listing.originalPrice && (
                <span className="text-[10px] text-muted-foreground line-through ml-1">{formatNaira(listing.originalPrice)}</span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-medium">{listing.rating}</span>
            </div>
          </div>

          {listing.isThrift && listing.depositAmount && (
            <p className="text-[9px] text-purple-500 font-semibold mt-1">
              Deposit {formatNaira(listing.depositAmount)} to hold
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MasonrySkeleton() {
  return (
    <div className="break-inside-avoid mb-3">
      <div className="rounded-2xl overflow-hidden bg-card border border-card-border">
        <Skeleton className="aspect-[3/4] w-full" />
        <div className="p-2.5 space-y-1.5">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAesthetic, setSelectedAesthetic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [quickViewListing, setQuickViewListing] = useState<Listing | null>(null);
  const [saveTarget, setSaveTarget] = useState<Listing | null>(null);

  const { listings: remoteListings, loading, error } = useListings();
  const allListings = remoteListings.length > 0 ? remoteListings : staticListings;
  const regularListings = allListings.filter((l) => !l.isThrift);
  const thriftListings = allListings.filter((l) => l.isThrift);

  const { isSaved } = useBoards();

  const filteredListings = useMemo(() => {
    let result = regularListings.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.sellerName.toLowerCase().includes(q) ||
        (l.tags ?? []).some((t) => t.toLowerCase().includes(q));
      const matchesCat = selectedCategory === "All" || l.category === selectedCategory;
      const matchesAesthetic =
        !selectedAesthetic ||
        (l.aesthetics ?? []).includes(selectedAesthetic as Listing["aesthetics"] extends (infer T)[] | undefined ? T : never);
      return matchesSearch && matchesCat && matchesAesthetic;
    });

    if (sortBy === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
    else if (sortBy === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "discount") result = [...result].sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    else result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    return result;
  }, [searchQuery, selectedCategory, selectedAesthetic, sortBy, regularListings]);

  const handleSave = (e: React.MouseEvent, listing: Listing) => {
    e.stopPropagation();
    setSaveTarget(listing);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Announcement bar ──────────────────── */}
      <div className="bg-primary text-primary-foreground text-center text-[11px] py-2 px-4 font-medium tracking-wide">
        🚚 Free delivery over ₦25,000 &nbsp;·&nbsp; 💳 Pay on delivery &nbsp;·&nbsp; ✨ 100% authentic
      </div>

      {/* ── Top nav ───────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <span className="text-2xl font-black tracking-tight text-primary cursor-pointer select-none">
              dripp<span className="text-foreground">.</span>
            </span>
          </Link>

          <div className="flex-1 relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search clothes, beauty, wigs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-full bg-muted border-transparent focus:border-primary text-sm"
            />
          </div>

          <div className="flex items-center gap-0.5">
            <ThemeSwitcher />
            <Link href="/boards">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full" title="My Boards">
                <Bookmark className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ShoppingBag className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Category pills */}
        <div className="border-t border-border/50">
          <div className="flex gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide max-w-7xl mx-auto">
            {CATEGORIES.slice(0, 20).map((cat) => (
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pb-28">
        {/* ── Hero (only on blank state) ──────── */}
        {!searchQuery && selectedCategory === "All" && !selectedAesthetic && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 mb-5 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/30 border border-primary/20 p-6 sm:p-10 relative"
          >
            <div className="relative z-10 max-w-lg">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                <Flame className="w-3 h-3" /> New drops every week
              </span>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
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
                <Link href="/boards">
                  <Button variant="outline" size="sm" className="rounded-full font-semibold">
                    <Bookmark className="w-3.5 h-3.5 mr-1.5" /> My Boards
                  </Button>
                </Link>
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[80px] opacity-20 pointer-events-none hidden sm:block select-none">✨</div>
          </motion.div>
        )}

        {/* ── Vibe filter ────────────────────── */}
        {!searchQuery && selectedCategory === "All" && (
          <section className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold">✨ Shop by Vibe</h2>
              {selectedAesthetic && (
                <button onClick={() => setSelectedAesthetic(null)} className="text-xs text-primary font-medium">Clear</button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {AESTHETICS.map(({ label, emoji }) => (
                <button
                  key={label}
                  onClick={() => setSelectedAesthetic(selectedAesthetic === label ? null : label)}
                  className={`shrink-0 flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full font-semibold border transition-all duration-150 whitespace-nowrap ${
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

        {/* ── Controls ───────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading..." : `${filteredListings.length} item${filteredListings.length !== 1 ? "s" : ""}`}
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
            <option value="discount">Best Discount</option>
          </select>
        </div>

        {/* ── Masonry Feed ────────────────────── */}
        {loading ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <MasonrySkeleton key={i} />)}
          </div>
        ) : error && filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">😕</p>
            <p className="font-semibold">Couldn't load products</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold">No items found</p>
            <Button
              variant="outline" size="sm" className="mt-4 rounded-full"
              onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setSelectedAesthetic(null); }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3">
            {filteredListings.map((listing, i) => (
              <MasonryCard
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

        {/* ── Thrift Drops Preview ─────────────── */}
        {!searchQuery && thriftListings.length > 0 && (
          <section className="mt-10 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black">💜 Thrift Drops</h2>
                <p className="text-xs text-muted-foreground mt-0.5">One-of-one vintage &amp; pre-loved — deposit to hold</p>
              </div>
              <Link href="/thrift-drops">
                <Button variant="outline" size="sm" className="rounded-full gap-1 text-xs font-semibold border-purple-300 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
            <div className="columns-2 sm:columns-3 gap-3">
              {thriftListings.slice(0, 3).map((listing, i) => (
                <MasonryCard
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

      {/* ── Bottom Tab Bar (mobile) ─────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border sm:hidden">
        <div className="grid grid-cols-4 h-16">
          {[
            { href: "/", icon: <Search className="w-5 h-5" />, label: "Discover" },
            { href: "/boards", icon: <Bookmark className="w-5 h-5" />, label: "Boards" },
            { href: "/thrift-drops", icon: <Recycle className="w-5 h-5" />, label: "Thrift" },
            { href: "#ai", icon: <Sparkles className="w-5 h-5" />, label: "Stylist" },
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href === "#ai" ? "/" : href}>
              <button className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-primary transition-colors active:scale-95">
                {icon}
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            </Link>
          ))}
        </div>
      </nav>

      {/* Modals */}
      <QuickViewModal listing={quickViewListing} onClose={() => setQuickViewListing(null)} />
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

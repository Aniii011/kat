import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListings } from "@/hooks/use-listings";
import { supabase } from "@/lib/supabase";
import {
  listings as staticListings, AESTHETICS, TOP_CATEGORIES, SUBCATEGORIES,
  CATEGORY_TO_TOP, type Listing, type TopCategory,
} from "@/data/listings";
import { useBoards } from "@/hooks/use-boards";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/hooks/use-cart";
import { useInteractions, type AffinityScores } from "@/hooks/use-interactions";
import { getListingSubcategories, popularCustomSubcategories, subKey, topCategoryOf } from "@/lib/subcategories";
import ThemeSwitcher from "@/components/theme-switcher";
import HeaderCartButton from "@/components/header-cart-button";
import { flyToCart } from "@/lib/cart-feedback";
import SaveToBoardModal from "@/components/save-to-board-modal";
import AuthModal from "@/components/auth-modal";
import {
  Search, ShoppingBag, Plus, Star, BadgeCheck, Flame, Sparkles,
  ChevronRight, Bookmark, Heart, LogIn, CheckCircle2, Play,
} from "lucide-react";
import { Gem, Crown, Leaf, Flower, TreePalm, Check, Recycle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

const VIBE_ICONS: Record<string, LucideIcon> = {
  "Old Money": Gem,
  "Baddie": Crown,
  "Boho": Leaf,
  "90s African Aunty": Flower,
  "Clean Girl": Sparkles,
  "Streetwear": Flame,
  "Vacay": TreePalm,
  "Soft Girl": Heart,
};

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

const BADGE_STYLES: Record<string, string> = {
  "Best Seller": "bg-amber-500 text-white",
  "Hot Deal":    "bg-rose-500 text-white",
  "New":         "bg-emerald-500 text-white",
  "Trending":    "bg-violet-500 text-white",
  "Limited":     "bg-purple-600 text-white",
};

// Announcement text can come from the database, so strip any emoji at render time.
const stripEmoji = (s: string) => s.replace(/[\p{Extended_Pictographic}\uFE0F\u200d]+\s*/gu, "").trim();

const DEFAULT_ANNOUNCEMENT_ITEMS = [
  "Shop the latest drops",
  "New arrivals daily",
  "Secure checkout",
  "Verified sellers only",
  "Fast delivery across Nigeria",
  "Trusted by thousands",
];

// ── Feed ranking ──
// A new random seed on every full page load (refresh) so the feed is not the
// exact same order each time, but it stays the same while the buyer navigates
// around the app, so coming back from a product shows the same feed.
const FEED_SEED = Math.random();

// Interest scores are fetched once and reused for a while, for the same reason:
// the feed shouldn't reshuffle under the buyer when they come back from a
// product they just tapped. New taps take effect on the next refresh/visit.
const AFFINITY_TTL_MS = 10 * 60 * 1000;
let affinityCache: { scores: AffinityScores; userId: string | null; at: number } | null = null;

function seededRandom(id: string, seed: number): number {
  let h = (2166136261 ^ Math.floor(seed * 4294967295)) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// Stops the feed showing one seller (or one look) over and over in a row:
// takes the ranked list and, where possible, avoids more than 2 in a row from
// the same seller.
function spreadSellers(ranked: Listing[]): Listing[] {
  const out: Listing[] = [];
  const pending = [...ranked];
  while (pending.length > 0) {
    const last = out.slice(-2).map((l) => l.sellerId ?? l.sellerName);
    let idx = 0;
    if (last.length === 2 && last[0] === last[1]) {
      const alt = pending.findIndex((l) => (l.sellerId ?? l.sellerName) !== last[0]);
      if (alt !== -1) idx = alt;
    }
    out.push(pending.splice(idx, 1)[0]);
  }
  return out;
}

const HOME_RESTORE_FLAG = "kat_home_restore";
const HOME_SCROLL_KEY = "kat_home_scroll";

// Reads the selected category / subcategory / vibe from the URL so they
// survive going into a product and coming back (and a page refresh).
function readHomeFiltersFromUrl(): { cat: TopCategory | "All"; sub: string | null; vibe: string | null } {
  if (typeof window === "undefined") return { cat: "All", sub: null, vibe: null };
  const p = new URLSearchParams(window.location.search);
  const rawCat = p.get("cat");
  const cat = rawCat && (TOP_CATEGORIES as readonly string[]).includes(rawCat) ? (rawCat as TopCategory) : "All";
  const sub = cat !== "All" ? p.get("sub") : null;
  const vibe = p.get("vibe");
  return { cat, sub: sub || null, vibe: vibe || null };
}

function ProductCard({
  listing, index, onSave, saved,
}: {
  listing: Listing; index: number;
  onSave: (e: React.MouseEvent, l: Listing) => void;
  saved: boolean;
}) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { logInteraction } = useInteractions(user?.id ?? null);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleCardTap = () => {
    // Tell Home to put the buyer back at this scroll position when they return.
    try { sessionStorage.setItem(HOME_RESTORE_FLAG, "1"); } catch {}
    logInteraction({
      listingId: listing.id,
      eventType: "tap",
      category: listing.category,
      subcategories: getListingSubcategories(listing.attributes),
      aesthetics: listing.aesthetics,
    });
  };

  const [, navigate] = useLocation();

  // A product with colours, clothing sizes, or shoe sizes can't be added
  // from this small card — there's nowhere here for the buyer to actually
  // pick one. Adding it straight to cart with no selection meant the seller
  // (and buyer) had no idea which colour/size was actually ordered. Send
  // them to the product page to choose instead, same as every other
  // marketplace does for a product with options.
  const hasOptionsToChoose =
    (listing.colors && listing.colors.length > 0) ||
    (listing.clothingSizes && listing.clothingSizes.length > 0) ||
    (listing.shoeSizes && listing.shoeSizes.length > 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/me";
      return;
    }
    if (hasOptionsToChoose) {
      navigate(`/listing/${listing.id}`);
      return;
    }
    addItem({
      listingId: listing.id,
      title: listing.title,
      price: listing.price,
      imageUrl: listing.imageUrl,
      sellerName: listing.sellerName,
      quantity: 1,
    });
    flyToCart(e.currentTarget as Element, listing.imageUrl);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.35), duration: 0.28 }}
    >
      <Link href={`/listing/${listing.id}`} onClick={handleCardTap}>
        <div className="group bg-card rounded-2xl overflow-hidden cursor-pointer border border-border hover:shadow-md transition-all duration-300">
          <div className="relative aspect-[3/4] overflow-hidden bg-muted">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {listing.videoUrl && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-3 h-3 text-white fill-white" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {listing.isThrift && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-purple-500 text-white leading-tight">
                  Thrift
                </span>
              )}
              {listing.badge && !listing.isThrift && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold leading-tight ${BADGE_STYLES[listing.badge] ?? "bg-gray-500 text-white"}`}>
                  {listing.badge}
                </span>
              )}
            </div>
            {listing.discount && (
              <span className="absolute bottom-2 left-2 text-[9px] px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground font-bold">
                -{listing.discount}%
              </span>
            )}

            {/* Heart stays on the image */}
            <motion.button
              onClick={(e) => onSave(e, listing)}
              whileTap={{ scale: 0.8 }}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all ${
                saved ? "bg-primary shadow-primary/30" : "bg-white/90 hover:bg-white"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${saved ? "fill-white text-white" : "text-gray-700"}`} />
            </motion.button>
          </div>
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
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {listing.rating || "New"}
                  </span>
                </div>
                <motion.button
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.85 }}
                  aria-label="Add to cart"
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
                    addedToCart ? "bg-emerald-500" : "bg-primary"
                  }`}
                >
                  {addedToCart ? (
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  ) : (
                    <div className="relative">
                      <ShoppingBag className="w-4 h-4 text-primary-foreground" />
                      <Plus className="w-2.5 h-2.5 text-primary bg-primary-foreground rounded-full absolute -top-1 -right-1.5" strokeWidth={4} />
                    </div>
                  )}
                </motion.button>
              </div>
            </div>
            {listing.isThrift && listing.depositAmount && (
              <p className="text-[9px] text-purple-500 font-semibold leading-tight">
                Deposit {formatNaira(listing.depositAmount)} to hold
              </p>
            )}
          </div>
        </div>
      </Link>
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

export default function Home() {
  const [initialFilters] = useState(readHomeFiltersFromUrl);
  const [topCategory, setTopCategory] = useState<TopCategory | "All">(initialFilters.cat);
  const [subCategory, setSubCategory] = useState<string | null>(initialFilters.sub);
  const [selectedAesthetic, setSelectedAesthetic] = useState<string | null>(initialFilters.vibe);
  const [sortBy, setSortBy] = useState("featured");
  const [saveTarget, setSaveTarget] = useState<Listing | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [announcementItems, setAnnouncementItems] = useState<string[]>(DEFAULT_ANNOUNCEMENT_ITEMS);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_announcements")
      .select("text")
      .eq("active", true)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        if (data && data.length > 0) setAnnouncementItems(data.map((a: any) => a.text));
      });
    return () => { cancelled = true; };
  }, []);

  const { user } = useAuth();
  const { listings: remoteListings, loading } = useListings();
  const allListings = remoteListings;
  const { isSaved } = useBoards();
  const { getAffinityScores } = useInteractions(user?.id ?? null);
  const [affinity, setAffinity] = useState<AffinityScores>(
    () => affinityCache?.scores ?? { categoryScores: {}, subcategoryScores: {}, aestheticScores: {} }
  );
  // The feed waits for interest scores (briefly) so it doesn't render in one
  // order and then jump to another a moment later.
  const [affinityReady, setAffinityReady] = useState(() => affinityCache !== null);

  useEffect(() => {
    const userId = user?.id ?? null;
    if (affinityCache && affinityCache.userId === userId && Date.now() - affinityCache.at < AFFINITY_TTL_MS) {
      setAffinity(affinityCache.scores);
      setAffinityReady(true);
      return;
    }
    let cancelled = false;
    const giveUp = setTimeout(() => { if (!cancelled) setAffinityReady(true); }, 2000);
    getAffinityScores().then((scores) => {
      affinityCache = { scores, userId, at: Date.now() };
      if (cancelled) return;
      setAffinity(scores);
      setAffinityReady(true);
    });
    return () => { cancelled = true; clearTimeout(giveUp); };
  }, [user?.id]);

  const feedLoading = loading || !affinityReady;

  const openLogin = () => { setAuthMode("login"); setShowAuth(true); };
  const openSignup = () => { setAuthMode("signup"); setShowAuth(true); };

  const userName = (user?.name || user?.email || "User").split(" ")[0];
  const userInitials = (user?.name || user?.email || "KA").slice(0, 2).toUpperCase();

  // Preset subcategories, plus custom ones sellers use a lot (so a subcategory
  // a seller typed shows up as a chip once enough products use it).
  const subcats = useMemo(() => {
    if (topCategory === "All") return [];
    const presets = SUBCATEGORIES[topCategory as TopCategory] ?? [];
    const customs = popularCustomSubcategories(
      allListings.map((l) => ({ top: topCategoryOf(l.category, l.isThrift), subs: getListingSubcategories(l.attributes) })),
      [topCategory]
    );
    return [...presets, ...customs];
  }, [topCategory, allListings]);

  const filteredListings = useMemo(() => {
    let result = allListings.filter((l) => {
      if (topCategory === "Thrift") return l.isThrift;
      if (topCategory === "Deals")  return !l.isThrift && (l.discount ?? 0) > 0;

      const matchesSub = !subCategory ||
        // A product can have several subcategories — match any of them.
        getListingSubcategories(l.attributes).some((s) => subKey(s) === subKey(subCategory)) ||
        // Fallback for legacy seed data, which never had attributes.subcategory
        // and instead stored the subcategory-style value directly on category.
        l.category === subCategory ||
        l.category.toLowerCase().includes(subCategory.toLowerCase());

      const matchesTop =
        topCategory === "All" ||
        (!l.isThrift && (
          // Seller-added products store the literal top-level category
          // (e.g. "Woman", "Shoes", "Jewelry & Accessories") directly on
          // `category` — check that first, before falling back to the
          // legacy subcategory-name-based mappings below (used by the
          // older seed data, which stores things like "Co-ords"/"Heels").
          l.category === topCategory ||
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
    else {
      // Default view ("featured"): a blend of what THIS person has shown
      // interest in (category, subcategory, vibe — signed in or not), how
      // popular and fresh a product is, and a per-load random factor so the
      // feed varies between visits and a shopper isn't shown the same few
      // items every time. Strong interests still win; the random part keeps
      // room for discovery.
      const maxOf = (m: Record<string, number>) => Math.max(1, ...Object.values(m));
      const maxCat = maxOf(affinity.categoryScores);
      const maxSub = maxOf(affinity.subcategoryScores);
      const maxAes = maxOf(affinity.aestheticScores);
      const popularityOf = (l: Listing) =>
        Math.log1p(l.sold ?? 0) * 1.0 + Math.log1p(l.reviewCount ?? 0) * 0.7 + (l.rating ?? 0) / 5;
      const maxPop = Math.max(1, ...result.map(popularityOf));
      const recencyIndex = new Map(allListings.map((l, i) => [l.id, i])); // newest first
      const total = Math.max(1, allListings.length - 1);

      const scoreOf = (l: Listing) => {
        const subScore = Math.max(0, ...getListingSubcategories(l.attributes).map((s) => affinity.subcategoryScores[s] ?? 0));
        const interest =
          0.5 * ((affinity.categoryScores[l.category] ?? 0) / maxCat) +
          0.3 * (subScore / maxSub) +
          0.2 * ((l.aesthetics ?? []).reduce((n, a) => n + (affinity.aestheticScores[a] ?? 0), 0) / maxAes);
        const popularity = popularityOf(l) / maxPop;
        const freshness = 1 - (recencyIndex.get(l.id) ?? total) / total;
        const jitter = seededRandom(l.id, FEED_SEED);
        return (
          0.45 * Math.min(1, interest) +
          0.2 * popularity +
          0.15 * freshness +
          (l.isFeatured ? 0.1 : 0) +
          0.35 * jitter
        );
      };
      const scored = new Map(result.map((l) => [l.id, scoreOf(l)]));
      result = spreadSellers([...result].sort((a, b) => (scored.get(b.id) ?? 0) - (scored.get(a.id) ?? 0)));
    }
    return result;
  }, [topCategory, subCategory, selectedAesthetic, sortBy, allListings, affinity]);

  // Keep the URL in sync with the selection (replace, not push, so the back
  // button doesn't have to step through every chip the buyer tapped).
  useEffect(() => {
    const params = new URLSearchParams();
    if (topCategory !== "All") params.set("cat", topCategory);
    if (topCategory !== "All" && subCategory) params.set("sub", subCategory);
    if (selectedAesthetic) params.set("vibe", selectedAesthetic);
    const qs = params.toString();
    const next = window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (next !== current) window.history.replaceState(window.history.state, "", next);
  }, [topCategory, subCategory, selectedAesthetic]);

  // Remember how far the buyer had scrolled, and put them back there when
  // they return from a product.
  const scrollYRef = useRef(0);
  const restoredRef = useRef(false);
  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      try {
        sessionStorage.setItem(
          HOME_SCROLL_KEY,
          JSON.stringify({ search: window.location.search, y: scrollYRef.current })
        );
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (restoredRef.current || feedLoading || filteredListings.length === 0) return;
    restoredRef.current = true;
    try {
      const shouldRestore = sessionStorage.getItem(HOME_RESTORE_FLAG) === "1";
      sessionStorage.removeItem(HOME_RESTORE_FLAG);
      if (!shouldRestore) return;
      const saved = JSON.parse(sessionStorage.getItem(HOME_SCROLL_KEY) || "null");
      if (saved && saved.search === window.location.search && typeof saved.y === "number") {
        requestAnimationFrame(() => window.scrollTo(0, saved.y));
      }
    } catch {}
  }, [feedLoading, filteredListings.length]);

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

  React.useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcementItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [announcementItems.length]);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Rotating announcement bar */}
      <div className="bg-primary text-primary-foreground text-center text-[11px] py-2 px-4 font-medium tracking-wide shrink-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={announcementIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="block"
          >
            {stripEmoji(announcementItems[announcementIndex % announcementItems.length])}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <span className="text-2xl font-black tracking-tight text-primary cursor-pointer select-none">
              KAT
            </span>
          </Link>

          <Link href="/search" className="flex-1 max-w-lg mx-auto">
            <div className="flex items-center gap-2 h-9 rounded-full bg-muted px-4 text-muted-foreground text-sm cursor-pointer hover:bg-accent transition-colors">
              <Search className="w-4 h-4 shrink-0" />
              <span>Search KAT...</span>
            </div>
          </Link>

          <div className="flex items-center gap-0.5">
            <ThemeSwitcher />
            <Link href="/boards">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hidden sm:flex" title="My Boards">
                <Bookmark className="w-4 h-4" />
              </Button>
            </Link>
            <HeaderCartButton />

            {user ? (
              <Link href="/me">
                <button className="hidden sm:flex items-center gap-2 ml-1 h-9 px-3 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-primary-foreground leading-none">
                      {userInitials}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-foreground truncate max-w-[80px]">
                    {userName}
                  </span>
                </button>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-1 ml-1">
                <Button variant="ghost" size="sm" className="rounded-full h-8 text-xs font-semibold" onClick={openLogin}>
                  <LogIn className="w-3.5 h-3.5 mr-1" /> Log In
                </Button>
                <Button size="sm" className="rounded-full h-8 text-xs font-semibold" onClick={openSignup}>
                  Sign Up
                </Button>
              </div>
            )}
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
                {cat}
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pb-28">

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
                Shop<br />
                <span className="text-primary">it all.</span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-sm">
                One marketplace, everything you need — browse, save, and shop with KAT.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                <Button size="sm" className="rounded-full gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> Shop Now
                </Button>
                <Link href="/thrift-drops">
                  <Button variant="outline" size="sm" className="rounded-full font-semibold border-primary/50 text-primary hover:bg-primary/10">
                    <Recycle className="w-3.5 h-3.5 mr-1.5" /> Thrift Drops
                  </Button>
                </Link>
              </div>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[72px] opacity-10 pointer-events-none hidden sm:block select-none">
              <Sparkles className="w-[72px] h-[72px]" />
            </div>
          </motion.div>
        )}

        {topCategory === "Deals" && (
          <div className="mt-4 mb-5 rounded-3xl bg-gradient-to-r from-rose-500 to-orange-400 p-5 text-white">
            <p className="text-2xl font-black flex items-center gap-2"><Flame className="w-6 h-6" /> Deals & Offers</p>
            <p className="text-sm opacity-90 mt-1">Up to 35% off selected items</p>
          </div>
        )}

        {topCategory === "All" && (
          <section className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary" /> Shop by Vibe</h2>
              {selectedAesthetic && (
                <button onClick={() => setSelectedAesthetic(null)} className="text-xs text-primary font-semibold">
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {AESTHETICS.map(({ label }) => {
                const VibeIcon = VIBE_ICONS[label];
                return (
                <button
                  key={label}
                  onClick={() => setSelectedAesthetic(selectedAesthetic === label ? null : label)}
                  className={`shrink-0 flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full font-semibold border transition-all whitespace-nowrap ${
                    selectedAesthetic === label
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {VibeIcon && <VibeIcon className="w-3.5 h-3.5" aria-hidden="true" />} {label}
                </button>
                );
              })}
            </div>
          </section>
        )}

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">
            {feedLoading ? "Loading..." : filteredListings.length === 0 ? "No items yet" : "\u00A0"}
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

        {feedLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-bold text-base">No items found</p>
            <Button variant="outline" size="sm" className="mt-5 rounded-full" onClick={() => { selectTop("All"); setSelectedAesthetic(null); }}>
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
                onSave={handleSave}
                saved={isSaved(listing.id)}
              />
            ))}
          </div>
        )}

        {topCategory === "All" && thriftPreview.length > 0 && (
          <section className="mt-12 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black flex items-center gap-1.5"><Recycle className="w-4 h-4 text-purple-500" /> Thrift Drops</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  One-of-one vintage & pre-loved — deposit to hold
                </p>
              </div>
              <Link href="/thrift-drops">
                <Button variant="outline" size="sm" className="rounded-full gap-1 text-xs font-semibold border-purple-300 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20">
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
                  onSave={handleSave}
                  saved={isSaved(listing.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Footer — public legal links (also required for Google sign-in verification) */}
        <footer className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} KAT. All rights reserved.</p>
          <nav className="flex items-center gap-4" aria-label="Legal">
            <Link href="/privacy" className="hover:text-foreground underline underline-offset-2">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground underline underline-offset-2">Terms of Service</Link>
          </nav>
        </footer>
      </main>

      {saveTarget && (
        <SaveToBoardModal
          open={!!saveTarget}
          onClose={() => setSaveTarget(null)}
          listingId={saveTarget.id}
          listingTitle={saveTarget.title}
        />
      )}
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} defaultMode={authMode} />
    </div>
  );
                }

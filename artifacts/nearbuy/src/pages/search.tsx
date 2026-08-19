import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/hooks/use-cart";
import {
  Search as SearchIcon, X, SlidersHorizontal, Star, BadgeCheck,
  ArrowLeft, Camera, Image, ShoppingBag, CheckCircle2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "36", "37", "38", "39", "40", "41", "42"];
const COLOR_OPTIONS = ["Black", "White", "Red", "Blue", "Pink", "Green", "Beige", "Brown", "Gold", "Silver"];
const TOP_CATEGORIES = ["Women", "Men", "Kids", "Shoes", "Jewelry & Accessories", "Beauty & Health", "Gym & Outdoor", "Home"];

// ── Local storage helpers for recent searches / recently viewed ──
const RECENT_SEARCHES_KEY = "kat_recent_searches";
const RECENTLY_VIEWED_KEY = "kat_recently_viewed";

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveRecentSearches(list: string[]) {
  try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list)); } catch {}
}
function loadRecentlyViewed(): any[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveRecentlyViewed(list: any[]) {
  try { localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list)); } catch {}
}

// ── Display-only normalization for popular-search labels ──
// Doesn't touch the underlying query string used for actual search.
const CATEGORY_KEYWORDS = [
  "dress", "dresses", "sneaker", "sneakers", "bag", "bags", "heel", "heels",
  "jean", "jeans", "jewelry", "shoe", "shoes", "top", "tops", "skirt", "skirts",
  "bodycon", "jumpsuit", "jumpsuits", "short", "shorts", "bra", "bras", "wig",
  "wigs", "lash", "lashes", "nail", "nails", "ring", "rings", "earring",
  "earrings", "necklace", "necklaces", "watch", "watches", "perfume", "perfumes",
  "sandal", "sandals", "boot", "boots", "hoodie", "hoodies", "jacket", "jackets",
];

function shortenSearchLabel(term: string): string {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i].replace(/[^a-z]/g, "");
    if (CATEGORY_KEYWORDS.includes(w)) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }
  }
  const fallback = words.slice(-2).join(" ");
  return fallback.replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProductCard({
  product, onAddToCart, addedId, onView,
}: {
  product: any; onAddToCart: (p: any) => void; addedId: string | null; onView?: (p: any) => void;
}) {
  const added = addedId === product.id;
  return (
    <Link href={`/listing/${product.id}`}>
      <div
        onClick={() => onView && onView(product)}
        className="group bg-card border border-card-border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="w-full h-full object-contain transition-transform duration-400 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          {product.discount && (
            <span className="absolute bottom-2 left-2 text-[9px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">-{product.discount}%</span>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }}
            className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${added ? "bg-emerald-500" : "bg-primary opacity-0 group-hover:opacity-100 sm:opacity-100"}`}
          >
            {added ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <ShoppingBag className="w-3.5 h-3.5 text-primary-foreground" />}
          </button>
        </div>
        <div className="p-2.5">
          <p className="text-[10px] text-muted-foreground truncate flex items-center gap-0.5">
            {product.seller_name}
            {product.is_verified_seller && <BadgeCheck className="w-2.5 h-2.5 text-primary inline shrink-0" />}
          </p>
          <p className="text-xs font-semibold leading-tight line-clamp-2 mt-0.5">{product.title}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs font-black text-primary">{formatNaira(product.price)}</span>
            {product.rating > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                <span className="text-[10px]">{Number(product.rating).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchTags, setImageSearchTags] = useState<string[]>([]);
  const [isImageSearch, setIsImageSearch] = useState(false);
  const [imageSearchError, setImageSearchError] = useState("");
  const [imageSearchPreview, setImageSearchPreview] = useState<string | null>(null);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("rating");

  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggedTermRef = useRef<string>("");
  const { addItem } = useCart();

  useEffect(() => {
    inputRef.current?.focus();
    fetchFeatured();
    fetchPopularSearches();
    setRecentSearches(loadRecentSearches());
    setRecentlyViewed(loadRecentlyViewed());
  }, []);

  const fetchFeatured = async () => {
    const { data } = await supabase.from("products").select("*").eq("is_thrift", false).order("created_at", { ascending: false }).limit(20);
    if (data) setFeatured(data);
  };

  const fetchPopularSearches = async () => {
    const { data } = await supabase
      .from("search_queries")
      .select("term")
      .order("search_count", { ascending: false })
      .limit(10);
    if (data && data.length > 0) setPopularSearches(data.map((d) => d.term));
  };

  const logSearch = async (term: string) => {
    const cleaned = term.trim().toLowerCase();
    if (cleaned.length < 2 || cleaned === loggedTermRef.current) return;
    loggedTermRef.current = cleaned;
    await supabase.rpc("increment_search", { search_term: cleaned });
  };

  const addRecentSearch = (term: string) => {
    const cleaned = term.trim();
    if (cleaned.length < 2) return;
    setRecentSearches((prev) => {
      const next = [cleaned, ...prev.filter((t) => t.toLowerCase() !== cleaned.toLowerCase())].slice(0, 8);
      saveRecentSearches(next);
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    saveRecentSearches([]);
  };

  const addRecentlyViewed = (product: any) => {
    if (!product?.id) return;
    setRecentlyViewed((prev) => {
      const entry = { id: product.id, title: product.title, image_url: product.image_url, price: product.price };
      const next = [entry, ...prev.filter((p) => p.id !== product.id)].slice(0, 20);
      saveRecentlyViewed(next);
      return next;
    });
  };

  const searchProducts = useCallback(async (q: string) => {
    setLoading(true);
    let queryBuilder = supabase.from("products").select("*");

    if (q.trim()) {
      queryBuilder = queryBuilder.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%,seller_name.ilike.%${q}%`);
    }
    if (selectedCategory) queryBuilder = queryBuilder.eq("category", selectedCategory);
    if (priceRange[0] > 0) queryBuilder = queryBuilder.gte("price", priceRange[0]);
    if (priceRange[1] < 100000) queryBuilder = queryBuilder.lte("price", priceRange[1]);
    if (sortBy === "price-asc") queryBuilder = queryBuilder.order("price", { ascending: true });
    else if (sortBy === "price-desc") queryBuilder = queryBuilder.order("price", { ascending: false });
    else if (sortBy === "rating") queryBuilder = queryBuilder.order("rating", { ascending: false });
    else queryBuilder = queryBuilder.order("created_at", { ascending: false });

    const { data } = await queryBuilder.limit(50);
    setResults(data || []);
    setLoading(false);

    if (q.trim()) {
      logSearch(q);
      addRecentSearch(q);
      fetchPopularSearches();
    }
  }, [selectedCategory, priceRange, sortBy]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (isImageSearch) return; // visual search results stay active; filters don't trigger keyword search
    if (!query.trim() && !selectedCategory && priceRange[0] === 0 && priceRange[1] === 100000) {
      setResults([]);
      setLoading(false);
      return;
    }
    searchTimeout.current = setTimeout(() => searchProducts(query), 300);
  }, [query, selectedCategory, priceRange, sortBy, isImageSearch]);

  const handleImageSearch = async (file: File) => {
    setImageSearchLoading(true);
    setImageSearchTags([]);
    setImageSearchError("");

    if (imageSearchPreview) URL.revokeObjectURL(imageSearchPreview);
    setImageSearchPreview(URL.createObjectURL(file));

    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Image search failed:", data.error);
        setImageSearchError("Couldn't search this image. Something went wrong while finding similar products.");
        setImageSearchLoading(false);
        return;
      }

      setImageSearchTags(data.tags || []);
      setResults(data.products || []);
      setIsImageSearch(true);
    } catch (err: any) {
      console.error("Image search failed:", err);
      setImageSearchError("Couldn't search this image. Something went wrong while finding similar products.");
    }

    setImageSearchLoading(false);
  };

  const clearImageSearch = () => {
    setIsImageSearch(false);
    setImageSearchTags([]);
    setImageSearchError("");
    if (imageSearchPreview) URL.revokeObjectURL(imageSearchPreview);
    setImageSearchPreview(null);
    setResults([]);
  };

  const handleAddToCart = (product: any) => {
    addItem({
      listingId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.image_url,
      sellerName: product.seller_name,
      quantity: 1,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const toggleSize = (s: string) => setSelectedSizes((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const toggleColor = (c: string) => setSelectedColors((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);
  const activeFilters = (selectedCategory ? 1 : 0) + selectedSizes.length + selectedColors.length + (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0);
  const clearAll = () => { setSelectedCategory(null); setSelectedSizes([]); setSelectedColors([]); setPriceRange([0, 100000]); };

  const displayProducts = query || selectedCategory || activeFilters > 0 || isImageSearch ? results : featured;
  const isSearching = query || selectedCategory || activeFilters > 0 || isImageSearch;
  const showIdleDiscovery = !query && !imageSearchLoading && !isSearching;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-3 h-14 flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search KAT..."
              className="w-full h-10 pl-9 pr-10 rounded-full bg-muted border border-transparent focus:border-primary outline-none text-sm focus:ring-1 focus:ring-primary transition-all"
            />
            {query && (
              <button onClick={() => { setQuery(""); clearImageSearch(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center">  <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Image search button — opens picker modal */}
          <button
            onClick={() => setIsImagePickerOpen(true)}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0"
            title="Search with an image"
          >
            <Camera className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Hidden file inputs */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setIsImagePickerOpen(false); handleImageSearch(f); } }} />
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setIsImagePickerOpen(false); handleImageSearch(f); } }} />

          {/* Filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full gap-1.5 shrink-0 relative">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {activeFilters > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">{activeFilters}</span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  Filters
                  {activeFilters > 0 && <button onClick={clearAll} className="text-xs text-primary font-semibold">Clear all</button>}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <p className="text-sm font-semibold mb-2">Sort by</p>
                  <div className="space-y-1">
                    {[["rating", "Top Rated"], ["price-asc", "Price: Low → High"], ["price-desc", "Price: High → Low"], ["new", "Newest"]].map(([v, l]) => (
                      <button key={v} onClick={() => setSortBy(v)} className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${sortBy === v ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Category</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TOP_CATEGORIES.map((cat) => (
                      <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Price range</p>
                  <Slider min={0} max={100000} step={1000} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} className="my-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatNaira(priceRange[0])}</span><span>{formatNaira(priceRange[1])}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Size</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SIZE_OPTIONS.map((s) => (
                      <button key={s} onClick={() => toggleSize(s)}
                        className={`text-xs w-10 h-9 rounded-xl border-2 font-semibold transition-all ${selectedSizes.includes(s) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Color</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button key={c} onClick={() => toggleColor(c)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${selectedColors.includes(c) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Image search picker modal */}
      <AnimatePresence>
        {isImagePickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsImagePickerOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full sm:w-96 sm:mx-4 bg-background rounded-t-[2rem] sm:rounded-2xl p-6 pb-8 sm:pb-6 shadow-xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsImagePickerOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center mt-2 mb-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <SearchIcon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-base font-black">Search with an image</h2>
                <p className="text-xs text-muted-foreground mt-1">Find products similar to a photo</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Camera className="w-4 h-4" /> Take a photo
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground font-medium">OR</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button
                  onClick={() => imageRef.current?.click()}
                  className="w-full h-12 rounded-2xl border border-border bg-muted font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent transition-colors"
                >
                  <Image className="w-4 h-4" /> Choose from gallery
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center mt-5">
                KAT will find visually similar products for you ✨
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-3 py-4 pb-24">

        {/* Image search loading */}
        {imageSearchLoading && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <Loader2 className="w-5 h-5 text-primary animate-spin absolute -bottom-1 -right-1 bg-background rounded-full p-0.5" />
            </div>
            <p className="text-sm font-bold mt-1">Finding similar products</p>
            <p className="text-xs text-muted-foreground text-center max-w-[220px]">Analyzing your photo and matching it with KAT products...</p>
          </div>
        )}

        {/* Image search error */}
        {!imageSearchLoading && imageSearchError && (
          <div className="mb-4 p-5 bg-card border border-card-border rounded-2xl flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <X className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-sm font-bold">Couldn't search this image</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">Something went wrong while finding similar products.</p>
            <Button size="sm" className="rounded-full mt-1" onClick={() => { setImageSearchError(""); setIsImagePickerOpen(true); }}>
              Try again
            </Button>
          </div>
        )}

        {/* Visual search summary + style tags */}
        {!imageSearchLoading && isImageSearch && !imageSearchError && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-3">
              {imageSearchPreview ? (
                <img src={imageSearchPreview} alt="Searched" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-primary flex items-center gap-1">✨ Visual search</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {loading ? "Matching products..." : `${results.length} similar product${results.length !== 1 ? "s" : ""} found`}
                </p>
              </div>
              <button
                onClick={clearImageSearch}
                className="text-[11px] text-muted-foreground hover:text-destructive font-medium shrink-0 px-2 py-1 rounded-full hover:bg-destructive/10 transition-colors"
              >
                ✕ Clear
              </button>
            </div>

            {imageSearchTags.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-1.5">✨ We found these styles</p>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {imageSearchTags.map((tag) => (
                    <span key={tag} className="shrink-0 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Idle landing state — recent searches, popular searches, recently viewed */}
        {showIdleDiscovery && (
          <div className="space-y-6 mb-2">
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold">Recent searches</p>
                  <button onClick={clearRecentSearches} className="text-[11px] text-muted-foreground font-medium hover:text-destructive transition-colors">
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button key={term} onClick={() => setQuery(term)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent border border-border hover:border-primary transition-all font-medium">
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {popularSearches.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-3">🔥 Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button key={term} onClick={() => setQuery(term)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent border border-border hover:border-primary transition-all font-medium">
                      {shortenSearchLabel(term)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recentlyViewed.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-3">Recently viewed</p>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                  {recentlyViewed.map((p) => (
                    <Link key={p.id} href={`/listing/${p.id}`}>
                      <div onClick={() => addRecentlyViewed(p)} className="shrink-0 w-28 cursor-pointer">
                        <div className="w-28 h-28 rounded-2xl overflow-hidden bg-muted border border-card-border">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] font-medium mt-1 line-clamp-1">{p.title}</p>
                        {typeof p.price === "number" && (
                          <p className="text-[11px] font-bold text-primary">{formatNaira(p.price)}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result title */}
        {!imageSearchLoading && isSearching && (
          isImageSearch ? (
            !imageSearchError && results.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-black">Similar finds ✨</p>
                <p className="text-xs text-muted-foreground">
                  Based on your photo · {results.length} similar product{results.length !== 1 ? "s" : ""}
                </p>
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground mb-3">
              {loading ? "Searching..." : `${results.length} result${results.length !== 1 ? "s" : ""}${query ? ` for "${query}"` : ""}`}
            </p>
          )
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card border border-card-border animate-pulse">
                <div className="aspect-[3/4] bg-muted" />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-2.5 bg-muted rounded w-20" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && !imageSearchLoading && isSearching && results.length === 0 && (
          isImageSearch ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📷</p>
              <p className="font-semibold">No close matches yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[260px] mx-auto">
                We couldn't find products that look very similar to this photo.
              </p>
              <Button size="sm" className="rounded-full mt-4" onClick={() => { clearImageSearch(); setIsImagePickerOpen(true); }}>
                Try another photo
              </Button>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold">No results found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search term or remove filters</p>
              <button onClick={clearAll} className="mt-3 text-xs text-primary font-semibold">Clear filters</button>
            </div>
          )
        )}

        {/* Results grid */}
        {!loading && !imageSearchLoading && (
          <div className="space-y-3">
            {!isSearching && featured.length > 0 && (
              <p className="text-sm font-bold">New Arrivals ✨</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {displayProducts.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                  <ProductCard product={product} onAddToCart={handleAddToCart} addedId={addedId} onView={addRecentlyViewed} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
    }

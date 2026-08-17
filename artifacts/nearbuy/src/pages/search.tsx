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

function ProductCard({ product, onAddToCart, addedId }: { product: any; onAddToCart: (p: any) => void; addedId: string | null }) {
  const added = addedId === product.id;
  return (
    <Link href={`/listing/${product.id}`}>
      <div className="group bg-card border border-card-border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer">
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
  const [loading, setLoading] = useState(false);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchTags, setImageSearchTags] = useState<string[]>([]);
  const [imageSearchError, setImageSearchError] = useState("");
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
      fetchPopularSearches();
    }
  }, [selectedCategory, priceRange, sortBy]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim() && !selectedCategory && priceRange[0] === 0 && priceRange[1] === 100000) {
      setResults([]);
      setLoading(false);
      return;
    }
    searchTimeout.current = setTimeout(() => searchProducts(query), 300);
  }, [query, selectedCategory, priceRange, sortBy]);

  const handleImageSearch = async (file: File) => {
    setImageSearchLoading(true);
    setImageSearchTags([]);
    setImageSearchError("");

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
        setImageSearchError(data.error || "Image search failed, please try again.");
        setImageSearchLoading(false);
        return;
      }

      setImageSearchTags(data.tags || []);
      setResults(data.products || []);
    } catch (err: any) {
      console.error("Image search failed:", err);
      setImageSearchError(err.message || "Image search failed, please try again.");
    }

    setImageSearchLoading(false);
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

  const displayProducts = query || selectedCategory || activeFilters > 0 ? results : featured;
  const isSearching = query || selectedCategory || activeFilters > 0;

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
              <button onClick={() => { setQuery(""); setResults([]); setImageSearchTags([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Image search buttons */}
          <button
            onClick={() => cameraRef.current?.click()}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0"
            title="Search by camera"
          >
            <Camera className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => imageRef.current?.click()}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0"
            title="Search by image"
          >
            <Image className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Hidden file inputs */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSearch(f); }} />
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSearch(f); }} />

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

      <main className="max-w-5xl mx-auto px-3 py-4 pb-24">

        {/* Image search loading */}
        {imageSearchLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-semibold">Analyzing image...</p>
            <p className="text-xs text-muted-foreground">Finding similar products on KAT</p>
          </div>
        )}

        {/* Image search error */}
        {!imageSearchLoading && imageSearchError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-2xl">
            <p className="text-xs text-destructive font-medium">{imageSearchError}</p>
          </div>
        )}

        {/* Image search tags */}
        {!imageSearchLoading && imageSearchTags.length > 0 && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-2xl">
            <p className="text-xs font-bold text-primary mb-2">🔍 Searching by image tags:</p>
            <div className="flex flex-wrap gap-1.5">
              {imageSearchTags.map((tag) => (
                <span key={tag} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Popular searches when idle — real data from search_queries table */}
        {!query && !imageSearchLoading && !isSearching && popularSearches.length > 0 && (
          <div className="mb-5">
            <p className="text-sm font-bold mb-3">🔥 Popular searches</p>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term) => (
                <button key={term} onClick={() => setQuery(term)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent border border-border hover:border-primary transition-all font-medium capitalize">
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result count */}
        {!imageSearchLoading && isSearching && (
          <p className="text-sm text-muted-foreground mb-3">
            {loading ? "Searching..." : `${results.length} result${results.length !== 1 ? "s" : ""}${query ? ` for "${query}"` : ""}`}
          </p>
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
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term or remove filters</p>
            <button onClick={clearAll} className="mt-3 text-xs text-primary font-semibold">Clear filters</button>
          </div>
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
                  <ProductCard product={product} onAddToCart={handleAddToCart} addedId={addedId} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
    }

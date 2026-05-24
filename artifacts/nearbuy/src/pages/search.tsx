import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { listings as staticListings, TOP_CATEGORIES, type Listing } from "@/data/listings";
import { useBoards } from "@/hooks/use-boards";
import QuickViewModal from "@/components/quick-view-modal";
import SaveToBoardModal from "@/components/save-to-board-modal";
import { Search as SearchIcon, X, SlidersHorizontal, Star, BadgeCheck, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

const SIZE_OPTIONS = ["XS","S","M","L","XL","XXL","36","37","38","39","40","41","42"];
const COLOR_OPTIONS = ["Black","White","Red","Blue","Pink","Green","Beige","Brown","Gold","Silver","Multi"];

function SearchCard({ listing, onQuickView, onSave, saved }: {
  listing: Listing; onQuickView: (l: Listing) => void;
  onSave: (e: React.MouseEvent, l: Listing) => void; saved: boolean;
}) {
  return (
    <div className="group bg-card border border-card-border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => onQuickView(listing)}>
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img src={listing.imageUrl} alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105" loading="lazy" />
        {listing.discount && (
          <span className="absolute bottom-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">-{listing.discount}%</span>
        )}
        <motion.button onClick={(e) => onSave(e, listing)} whileTap={{ scale: 0.82 }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${saved ? "bg-primary" : "bg-white/90"}`}>
          <Heart className={`w-3.5 h-3.5 ${saved ? "fill-white text-white" : "text-gray-600"}`} />
        </motion.button>
      </div>
      <div className="p-2.5">
        <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
          {listing.sellerName}{listing.isVerifiedSeller && <BadgeCheck className="w-2.5 h-2.5 text-primary inline shrink-0" />}
        </p>
        <p className="text-xs font-semibold leading-tight line-clamp-2 mt-0.5">{listing.title}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-black text-primary">{formatNaira(listing.price)}</span>
          <div className="flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px]">{listing.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("rating");
  const [quickView, setQuickView] = useState<Listing | null>(null);
  const [saveTarget, setSaveTarget] = useState<Listing | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isSaved } = useBoards();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    let filtered = staticListings.filter((l) => {
      const matchQ = !q || l.title.toLowerCase().includes(q) || l.sellerName.toLowerCase().includes(q) || (l.tags ?? []).some((t) => t.toLowerCase().includes(q)) || l.category.toLowerCase().includes(q);
      const matchCat = !selectedCategory || l.category === selectedCategory;
      const matchPrice = l.price >= priceRange[0] && l.price <= priceRange[1];
      const matchSize = selectedSizes.length === 0 || [...(l.clothingSizes ?? []), ...(l.shoeSizes ?? [])].some((s) => selectedSizes.includes(s));
      const matchColor = selectedColors.length === 0 || (l.colors ?? []).some((c) => selectedColors.some((sel) => c.toLowerCase().includes(sel.toLowerCase())));
      return matchQ && matchCat && matchPrice && matchSize && matchColor;
    });

    if (sortBy === "price-asc") filtered = filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") filtered = filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === "discount") filtered = filtered.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    else filtered = filtered.sort((a, b) => b.rating - a.rating);
    return filtered;
  }, [query, selectedCategory, priceRange, selectedSizes, selectedColors, sortBy]);

  const toggleSize = (s: string) => setSelectedSizes((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const toggleColor = (c: string) => setSelectedColors((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);
  const activeFilters = (selectedCategory ? 1 : 0) + selectedSizes.length + selectedColors.length + (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0);
  const clearAll = () => { setSelectedCategory(null); setSelectedSizes([]); setSelectedColors([]); setPriceRange([0, 100000]); };

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
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search KAT..."
              className="w-full h-10 pl-9 pr-10 rounded-full bg-muted border border-transparent focus:border-primary outline-none text-sm focus:ring-1 focus:ring-primary transition-all" />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full gap-1.5 shrink-0 relative">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
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
                {/* Sort */}
                <div>
                  <p className="text-sm font-semibold mb-2">Sort by</p>
                  <div className="space-y-1">
                    {[["rating","Top Rated"],["price-asc","Price: Low → High"],["price-desc","Price: High → Low"],["discount","Best Discount"]].map(([v,l]) => (
                      <button key={v} onClick={() => setSortBy(v)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${sortBy === v ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <p className="text-sm font-semibold mb-2">Category</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TOP_CATEGORIES.filter((c) => c !== "Thrift" && c !== "Deals").map((cat) => (
                      <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <p className="text-sm font-semibold mb-2">Price range</p>
                  <Slider min={0} max={100000} step={1000} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} className="my-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatNaira(priceRange[0])}</span><span>{formatNaira(priceRange[1])}</span>
                  </div>
                </div>

                {/* Size */}
                <div>
                  <p className="text-sm font-semibold mb-2">Size</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SIZE_OPTIONS.map((s) => (
                      <button key={s} onClick={() => toggleSize(s)}
                        className={`text-xs w-10 h-9 rounded-xl border-2 font-semibold transition-all ${selectedSizes.includes(s) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* Color */}
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
        {/* Popular when no query */}
        {!query && (
          <div className="mb-5">
            <p className="text-sm font-bold mb-3">🔥 Popular searches</p>
            <div className="flex flex-wrap gap-2">
              {["ankara dress","gym set","wig","sneakers","blazer","bodycon","bikini","jewellery","hoodie","kente"].map((term) => (
                <button key={term} onClick={() => setQuery(term)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent border border-border hover:border-primary transition-all font-medium">
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {query && (
          <p className="text-sm text-muted-foreground mb-3">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;<span className="font-semibold text-foreground">{query}</span>&rdquo;
          </p>
        )}

        {results.length === 0 && query ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold">No results for "{query}"</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term or remove filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {(query ? results : staticListings.filter((l) => !l.isThrift)).map((listing, i) => (
              <motion.div key={listing.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                <SearchCard listing={listing} onQuickView={setQuickView}
                  onSave={(e, l) => { e.stopPropagation(); setSaveTarget(l); }} saved={isSaved(listing.id)} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <QuickViewModal listing={quickView} onClose={() => setQuickView(null)} />
      {saveTarget && <SaveToBoardModal open={!!saveTarget} onClose={() => setSaveTarget(null)} listingId={saveTarget.id} listingTitle={saveTarget.title} />}
    </div>
  );
}

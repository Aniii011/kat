import React, { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/hooks/use-cart";
import {
  ArrowLeft, Star, BadgeCheck, Users, Package, ShoppingBag,
  MessageCircle, Search, CheckCircle2, Store as StoreIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Star, BadgeCheck, Users, Package, ShoppingBag,
  MessageCircle, Search, CheckCircle2, Store as StoreIcon, Flag,
} from "lucide-react";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

type SortOption = "relevance" | "top-sales" | "recent" | "price-asc" | "price-desc";

export default function Store() {
  const [, params] = useRoute("/store/:sellerId");
  const sellerId = params?.sellerId ?? null;
  const { user } = useAuth();
  const { addItem } = useCart();

  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"items" | "categories" | "reviews">("items");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [search, setSearch] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    fetchStoreData();
  }, [sellerId, user]);

  const fetchStoreData = async () => {
    setLoading(true);

    const { data: sellerData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sellerId)
      .single();

    if (sellerData) setSeller(sellerData);

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (productsData) setProducts(productsData);

    const { count } = await supabase
      .from("seller_follows")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", sellerId);

    setFollowersCount(count || 0);

    if (user) {
      const { data: followData } = await supabase
        .from("seller_follows")
        .select("*")
        .eq("follower_id", user.id)
        .eq("seller_id", sellerId)
        .maybeSingle();
      setIsFollowing(!!followData);
    }

    setLoading(false);
  };

  const toggleFollow = async () => {
    if (!user) return;
    setFollowLoading(true);

    if (isFollowing) {
      await supabase
        .from("seller_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("seller_id", sellerId);
      setIsFollowing(false);
      setFollowersCount((prev) => Math.max(0, prev - 1));
    } else {
      await supabase
        .from("seller_follows")
        .insert({ follower_id: user.id, seller_id: sellerId });
      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
    }

    setFollowLoading(false);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      listingId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.image_url,
      sellerName: seller?.store_name || seller?.full_name || "Seller",
      quantity: 1,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const filteredProducts = products
    .filter((p) => !search || p.title?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "top-sales") return (b.sold || 0) - (a.sold || 0);
      return 0;
    });

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const totalSold = products.reduce((sum, p) => sum + (p.sold || 0), 0);
  const avgRating = products.length > 0
    ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-14 border-b flex items-center px-4">
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <StoreIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-lg">Store not found</p>
          <Link href="/"><Button variant="outline" size="sm" className="mt-4 rounded-full">Back to shop</Button></Link>
        </div>
      </div>
    );
  }

  const storeName = seller.store_name || seller.full_name || "KAT Seller";
  const storeInitials = storeName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${storeName}...`}
              className="rounded-full pl-9 h-9 text-sm bg-muted border-0"
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4">

        {/* Store info card */}
        <div className="py-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              {seller.store_banner_url ? (
                <img src={seller.store_banner_url} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-primary">{storeInitials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black truncate">{storeName}</h1>
                {seller.seller_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
              </div>
              {seller.store_description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{seller.store_description}</p>
              )}
              <div className="flex items-center gap-1 mt-1">
                {avgRating > 0 && (
                  <>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold">{avgRating.toFixed(1)}</span>
                  </>
                )}
                <span className="text-xs text-muted-foreground ml-1">
                  Joined KAT {new Date(seller.created_at).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
            {user?.id !== sellerId && (
              <Button
                onClick={toggleFollow}
                disabled={followLoading || !user}
                size="sm"
                className={`rounded-full text-xs font-bold shrink-0 ${
                  isFollowing
                    ? "bg-muted text-foreground hover:bg-accent"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {isFollowing ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Following</>
                ) : (
                  "+ Follow"
                )}
              </Button>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card border border-card-border rounded-xl p-3 text-center">
              <p className="text-base font-black">{followersCount.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Followers</p>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-3 text-center">
              <p className="text-base font-black">{totalSold.toLocaleString()}+</p>
              <p className="text-[10px] text-muted-foreground">Sold</p>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-3 text-center">
              <p className="text-base font-black">{products.length}</p>
              <p className="text-[10px] text-muted-foreground">Items</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-2xl mb-4">
          {([
            { key: "items", label: "Items" },
            { key: "categories", label: "Categories" },
            { key: "reviews", label: `Reviews${avgRating > 0 ? ` (${avgRating.toFixed(1)}★)` : ""}` },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-background shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items tab */}
        {activeTab === "items" && (
          <div className="space-y-3">
            {/* Sort bar */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {([
                { key: "relevance", label: "Relevance" },
                { key: "top-sales", label: "Top Sales" },
                { key: "recent", label: "Most Recent" },
                { key: "price-asc", label: "Price ↑" },
                { key: "price-desc", label: "Price ↓" },
              ] as const).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    sortBy === s.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-sm">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <Link href={`/listing/${p.id}`}>
                      <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-md transition-all cursor-pointer">
                        <div className="relative aspect-square bg-muted overflow-hidden">
                          {p.image_url && (
                            <img src={p.image_url} alt={p.title} className="w-full h-full object-contain" />
                          )}
                          {p.discount && (
                            <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-md bg-rose-500 text-white font-bold">
                              -{p.discount}%
                            </span>
                          )}
                          <motion.button
                            onClick={(e) => handleQuickAdd(e, p)}
                            whileTap={{ scale: 0.85 }}
                            className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
                              addedId === p.id ? "bg-emerald-500" : "bg-primary"
                            }`}
                          >
                            {addedId === p.id ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <ShoppingBag className="w-3.5 h-3.5 text-primary-foreground" />
                            )}
                          </motion.button>
                        </div>
                        <div className="p-2.5 space-y-1">
                          <p className="text-xs font-semibold line-clamp-2 leading-snug">{p.title}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-primary">{formatNaira(p.price)}</span>
                            {p.sold > 0 && (
                              <span className="text-[10px] text-muted-foreground">{p.sold} sold</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories tab */}
        {activeTab === "categories" && (
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No categories yet</p>
            ) : (
              categories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => { setActiveTab("items"); }}
                    className="w-full flex items-center justify-between bg-card border border-card-border rounded-2xl p-4 hover:border-primary/40 transition-colors"
                  >
                    <span className="text-sm font-semibold">{cat}</span>
                    <span className="text-xs text-muted-foreground">{count} item{count !== 1 ? "s" : ""}</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === "reviews" && (
          <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
            <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-sm">No reviews yet</p>
            <p className="text-xs text-muted-foreground mt-1">Reviews from buyers will appear here</p>
          </div>
        )}
        <div className="pt-4 pb-2">
  <button
    onClick={() => {
      if (window.confirm("Report this seller to KAT admin?")) {
        window.open(`https://wa.me/2348103925304?text=I want to report seller: ${storeName} (ID: ${sellerId})`, "_blank");
      }
    }}
    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
  >
    <Flag className="w-3.5 h-3.5" /> Report this seller
  </button>
</div>
      </div>
    </div>
  );
}

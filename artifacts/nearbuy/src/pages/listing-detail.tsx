import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import { useListing, useListings } from "@/hooks/use-listings";
import { listings as staticListings } from "@/data/listings";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  ArrowLeft, Star, ShoppingBag, Zap, Shield, RotateCcw,
  Truck, BadgeCheck, ChevronLeft, ChevronRight, Minus, Plus,
  Heart, Share2, Users, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    <div className="flex items-center gap-2">
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/20"}`} />
        ))}
      </div>
      <span className="text-sm font-bold">{rating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">{count.toLocaleString()} reviews</span>
    </div>
  );
}

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const id = params?.id ? parseInt(params.id) : null;

  const { listing: remoteListing, loading, error } = useListing(id);
  const fallback = staticListings.find((l) => l.id === id) ?? null;
  const listing = remoteListing ?? fallback;

  const { listings: remoteAll } = useListings();
  const allListings = remoteAll.length > 0 ? remoteAll : staticListings;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);

  const related = listing
    ? allListings.filter((l) => l.id !== listing.id && (l.category === listing.category || l.aesthetics?.some((a) => listing.aesthetics?.includes(a)))).slice(0, 4)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border h-14 flex items-center px-4 gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </header>
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-[3/4] rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="font-bold text-lg">Item not found</p>
          <Link href="/"><Button variant="outline" size="sm" className="mt-4 rounded-full">Back to shop</Button></Link>
        </div>
      </div>
    );
  }

  const images = listing.images.length > 0 ? listing.images : [listing.imageUrl];
  const allSizes = listing.clothingSizes ?? listing.shoeSizes ?? [];
  const sizeLabel = listing.shoeSizes ? "Shoe Size" : "Size";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{listing.title}</p>
          </div>
          <ThemeSwitcher />
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full" onClick={() => setWishlisted(!wishlisted)}>
            <Heart className={`w-4.5 h-4.5 ${wishlisted ? "fill-primary text-primary" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
            <Share2 className="w-4.5 h-4.5" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 pb-32 sm:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6 lg:gap-10">
          {/* ── Image Gallery ──────────────────────── */}
          <div className="space-y-3">
            <div className="relative rounded-3xl overflow-hidden bg-muted aspect-[3/4]">
              <img
                src={images[selectedImage]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              {listing.badge && (
                <span className={`absolute top-3 left-3 text-xs px-3 py-1 rounded-full font-bold ${BADGE_STYLES[listing.badge] ?? "bg-gray-500 text-white"}`}>
                  {listing.badge}
                </span>
              )}
              {listing.isThrift && (
                <span className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full font-bold bg-purple-500 text-white">
                  Thrift Drop 💜
                </span>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center shadow-md hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((p) => (p + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center shadow-md hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-80"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ──────────────────────── */}
          <div className="space-y-4">
            {/* Seller */}
            <div className="flex items-center gap-2.5">
              {listing.sellerAvatar && (
                <img src={listing.sellerAvatar} alt={listing.sellerName} className="w-8 h-8 rounded-full object-cover border-2 border-border" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold truncate">{listing.sellerName}</span>
                  {listing.isVerifiedSeller && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                </div>
                {listing.sellerFollowers && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {listing.sellerFollowers.toLocaleString()} followers
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold h-7 px-3 border-primary text-primary hover:bg-primary/10">
                Follow
              </Button>
            </div>

            <Separator />

            {/* Title */}
            <div>
              <h1 className="text-xl font-black leading-tight">{listing.title}</h1>
              {listing.brand && <p className="text-xs text-muted-foreground mt-0.5">{listing.brand}</p>}
            </div>

            {/* Rating */}
            <StarRow rating={listing.rating} count={listing.reviewCount} />

            {/* Aesthetics */}
            {listing.aesthetics && listing.aesthetics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {listing.aesthetics.map((a) => (
                  <span key={a} className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full font-semibold">{a}</span>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-primary">{formatNaira(listing.price)}</span>
              {listing.originalPrice && (
                <span className="text-base text-muted-foreground line-through">{formatNaira(listing.originalPrice)}</span>
              )}
              {listing.discount && (
                <span className="text-sm font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">-{listing.discount}%</span>
              )}
            </div>

            {/* Thrift deposit notice */}
            {listing.isThrift && listing.depositAmount && (
              <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">One-of-one item — deposit required</span>
                </div>
                <p className="text-xs text-muted-foreground">Pay {formatNaira(listing.depositAmount)} deposit to secure this piece for 24 hours while you complete payment.</p>
              </div>
            )}

            {/* Color selector */}
            {listing.colors && listing.colors.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Colour {selectedColor && <span className="text-muted-foreground font-normal">— {selectedColor}</span>}</p>
                <div className="flex flex-wrap gap-2">
                  {listing.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(selectedColor === c ? null : c)}
                      className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${selectedColor === c ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {allSizes.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">{sizeLabel} {selectedSize && <span className="text-muted-foreground font-normal">— {selectedSize}</span>}</p>
                <div className="flex flex-wrap gap-2">
                  {allSizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                      className={`text-xs w-10 h-10 rounded-xl border-2 font-semibold transition-all ${selectedSize === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {!listing.isThrift && (
              <div>
                <p className="text-sm font-semibold mb-2">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-base">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(listing.stockCount, quantity + 1))}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-muted-foreground">{listing.stockCount} available</span>
                </div>
              </div>
            )}

            {/* Stock warning */}
            {listing.stockCount <= 3 && listing.stockCount > 0 && !listing.isThrift && (
              <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800">
                🔥 Only {listing.stockCount} left in stock — order soon!
              </p>
            )}

            {/* CTAs */}
            <div className="flex gap-3">
              {listing.isThrift ? (
                <Button
                  className="flex-1 rounded-full font-bold text-sm h-12 bg-purple-500 hover:bg-purple-600 border-0"
                  onClick={() => setShowDeposit(true)}
                >
                  💜 Pay Deposit — {formatNaira(listing.depositAmount ?? 0)}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full font-bold text-sm h-12 border-primary text-primary hover:bg-primary/10"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" /> Add to Bag
                  </Button>
                  <Button className="flex-1 rounded-full font-bold text-sm h-12">
                    <Zap className="w-4 h-4 mr-2" /> Buy Now
                  </Button>
                </>
              )}
            </div>

            {/* Delivery info */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { icon: <Truck className="w-3.5 h-3.5 text-primary" />, text: listing.freeShipping ? "Free delivery" : `Delivery ₦1,500` },
                { icon: <RotateCcw className="w-3.5 h-3.5 text-primary" />, text: "14-day returns" },
                { icon: <Shield className="w-3.5 h-3.5 text-primary" />, text: "Buyer protection" },
              ].map((item) => (
                <div key={item.text} className="bg-muted rounded-xl p-2.5 flex flex-col items-center gap-1 text-center">
                  {item.icon}
                  <span className="text-[10px] font-medium leading-tight">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────── */}
        <Tabs defaultValue="description" className="mt-8">
          <TabsList className="rounded-full bg-muted p-1 h-auto">
            <TabsTrigger value="description" className="rounded-full text-xs px-4 py-1.5">Description</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-full text-xs px-4 py-1.5">
              Reviews ({listing.reviews?.length ?? listing.reviewCount})
            </TabsTrigger>
            <TabsTrigger value="seller" className="rounded-full text-xs px-4 py-1.5">Seller</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-4">
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
              {listing.tags && listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {listing.tags.map((t) => (
                    <span key={t} className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full">#{t}</span>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 space-y-3">
            {listing.reviews && listing.reviews.length > 0 ? (
              listing.reviews.map((r) => (
                <div key={r.id} className="bg-card border border-card-border rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <img src={r.avatar} alt={r.author} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{r.author}</span>
                        {r.verified && (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                            <BadgeCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground ml-auto">{r.date}</span>
                      </div>
                      <div className="flex mt-1 mb-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                        ))}
                      </div>
                      <p className="text-sm font-semibold">{r.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{r.body}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No reviews yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="seller" className="mt-4">
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                {listing.sellerAvatar && (
                  <img src={listing.sellerAvatar} alt={listing.sellerName} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{listing.sellerName}</span>
                    {listing.isVerifiedSeller && <BadgeCheck className="w-4 h-4 text-primary" />}
                  </div>
                  {listing.sellerFollowers && (
                    <p className="text-xs text-muted-foreground">{listing.sellerFollowers.toLocaleString()} followers</p>
                  )}
                  <div className="flex mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(listing.sellerRating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{listing.sellerRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full w-full font-semibold border-primary text-primary hover:bg-primary/10">
                Follow Seller
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Related Products ─────────────────────── */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-base font-black mb-4">You might also love ✨</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {related.map((item) => (
                <Link key={item.id} href={`/listing/${item.id}`}>
                  <div className="group rounded-2xl overflow-hidden bg-card border border-card-border hover:shadow-md transition-all duration-300 cursor-pointer">
                    <div className="aspect-[3/4] overflow-hidden bg-muted">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold line-clamp-2 leading-tight">{item.title}</p>
                      <p className="text-sm font-black text-primary mt-1">{formatNaira(item.price)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border sm:hidden z-30">
        <div className="flex gap-3 max-w-lg mx-auto">
          {listing.isThrift ? (
            <Button className="flex-1 rounded-full font-bold bg-purple-500 hover:bg-purple-600 border-0" onClick={() => setShowDeposit(true)}>
              💜 Pay Deposit — {formatNaira(listing.depositAmount ?? 0)}
            </Button>
          ) : (
            <>
              <Button variant="outline" className="flex-1 rounded-full font-bold border-primary text-primary hover:bg-primary/10">
                <ShoppingBag className="w-4 h-4 mr-1.5" /> Bag
              </Button>
              <Button className="flex-1 rounded-full font-bold">
                <Zap className="w-4 h-4 mr-1.5" /> Buy Now
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Deposit dialog */}
      <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-black">💜 Secure Your Piece</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Pay a deposit to hold <strong>{listing.title}</strong> exclusively for 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{formatNaira(listing.depositAmount ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Deposit (deducted from total price)</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p>✓ Item held exclusively for you for 24 hours</p>
              <p>✓ Deposit deducted from final price of {formatNaira(listing.price)}</p>
              <p>✓ Fully refundable if item is misrepresented</p>
            </div>
            <Button className="w-full rounded-full font-bold bg-purple-500 hover:bg-purple-600 border-0 h-12">
              Pay via Transfer or Card
            </Button>
            <Button variant="ghost" size="sm" className="w-full rounded-full text-xs" onClick={() => setShowDeposit(false)}>
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

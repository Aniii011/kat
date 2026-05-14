import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import { listings } from "@/data/listings";
import {
  ArrowLeft, Star, ShoppingCart, Zap, Shield, RotateCcw,
  Truck, BadgeCheck, ChevronLeft, ChevronRight, Minus, Plus,
  Heart, Share2, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BADGE_STYLES: Record<string, string> = {
  "Best Seller": "bg-amber-500 text-white",
  "Hot Deal": "bg-rose-500 text-white",
  "New": "bg-emerald-500 text-white",
};

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < Math.floor(rating) || (i < rating && rating % 1 > 0 && i === Math.floor(rating)) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-gray-800">{rating.toFixed(1)}</span>
      <span className="text-sm text-gray-500">{count.toLocaleString()} reviews</span>
    </div>
  );
}

function RatingBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-12 text-right text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-gray-500 shrink-0">{pct}%</span>
    </div>
  );
}

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const id = params?.id ? parseInt(params.id, 10) : null;
  const listing = listings.find((l) => l.id === id);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(
    listing?.colors?.[0] ?? null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    listing?.sizes?.[0] ?? null
  );
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <Package className="h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Product not found</h2>
        <p className="text-gray-500 mb-6 text-sm">This item may have been sold or removed.</p>
        <Link href="/">
          <Button className="gap-2 rounded-full px-6">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Button>
        </Link>
      </div>
    );
  }

  const relatedProducts = listings.filter(
    (l) => l.id !== listing.id && l.category === listing.category
  ).slice(0, 4);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const savings = listing.originalPrice ? listing.originalPrice - listing.price : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Store</span>
          </Link>
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-lg tracking-tight text-gray-900">
              Near<span className="text-primary">Buy</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWishlisted((v) => !v)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Heart className={`h-5 w-5 ${wishlisted ? "fill-rose-500 text-rose-500" : "text-gray-500"}`} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Share2 className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/" className="hover:text-primary transition-colors">{listing.category}</Link>
          <span>/</span>
          <span className="text-gray-600 truncate max-w-[200px]">{listing.title}</span>
        </nav>

        {/* Main product layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 xl:gap-14">
          {/* ── Left: Gallery ── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm group">
              <img
                src={listing.images[activeImage]}
                alt={listing.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {listing.badge && (
                <div className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm ${BADGE_STYLES[listing.badge]}`}>
                  {listing.badge}
                </div>
              )}
              {listing.discount && (
                <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-rose-500 text-white flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[10px] font-semibold leading-none">SAVE</span>
                  <span className="text-sm font-extrabold leading-none">{listing.discount}%</span>
                </div>
              )}
              {/* Prev/Next */}
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((v) => (v - 1 + listing.images.length) % listing.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setActiveImage((v) => (v + 1) % listing.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === i ? "border-primary shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product info ── */}
          <div className="flex flex-col gap-5">
            {/* Category + sold */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                {listing.category}
              </span>
              {listing.sold > 0 && (
                <span className="text-xs text-gray-500">{listing.sold.toLocaleString()} sold</span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug">
              {listing.title}
            </h1>

            {/* Ratings */}
            <div className="flex items-center gap-4 flex-wrap">
              <StarRow rating={listing.rating} count={listing.reviewCount} />
              {listing.isVerifiedSeller && (
                <span className="flex items-center gap-1 text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified Seller
                </span>
              )}
            </div>

            {/* Price block */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-4xl font-extrabold text-gray-900">
                  ${listing.price.toLocaleString()}
                </span>
                {listing.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    ${listing.originalPrice.toLocaleString()}
                  </span>
                )}
                {listing.discount && (
                  <span className="text-sm font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                    -{listing.discount}% OFF
                  </span>
                )}
              </div>
              {savings > 0 && (
                <p className="text-sm text-emerald-600 font-semibold">
                  You save ${savings.toLocaleString()} 🎉
                </p>
              )}
            </div>

            {/* Shipping */}
            <div className="flex items-start gap-3">
              <Truck className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
              <div>
                {listing.freeShipping ? (
                  <p className="text-sm font-semibold text-emerald-600">Free Shipping</p>
                ) : (
                  <p className="text-sm font-medium text-gray-700">Standard Shipping</p>
                )}
                <p className="text-xs text-gray-500">
                  Estimated delivery: {listing.shippingDays}–{listing.shippingDays + 2} business days
                </p>
              </div>
            </div>

            <Separator />

            {/* Color variant */}
            {listing.colors && listing.colors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Color: <span className="font-normal text-gray-600">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {listing.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        selectedColor === c
                          ? "border-primary bg-primary/5 text-primary font-semibold shadow-sm"
                          : "border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size variant */}
            {listing.sizes && listing.sizes.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Size: <span className="font-normal text-gray-600">{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {listing.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold border transition-all ${
                        selectedSize === s
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + stock */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Qty:</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors border-r border-gray-200"
                  >
                    <Minus className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((v) => Math.min(listing.stockCount, v + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors border-l border-gray-200"
                  >
                    <Plus className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                </div>
              </div>
              {listing.stockCount <= 3 && listing.inStock && (
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                  Only {listing.stockCount} left!
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1 h-12 text-base font-semibold rounded-xl border-2 border-primary text-primary hover:bg-primary/5 gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                {addedToCart ? "Added!" : "Add to Cart"}
              </Button>
              <Button className="flex-1 h-12 text-base font-semibold rounded-xl gap-2 bg-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                <Zap className="h-5 w-5" />
                Buy Now
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { icon: Shield, label: "Secure Checkout" },
                { icon: RotateCcw, label: "Easy Returns" },
                { icon: BadgeCheck, label: "Buyer Protected" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-gray-100 text-center">
                  <Icon className="h-5 w-5 text-primary/70" />
                  <span className="text-[10px] font-medium text-gray-500 leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Seller */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
                {listing.sellerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-800 truncate">{listing.sellerName}</p>
                  {listing.isVerifiedSeller && <BadgeCheck className="h-4 w-4 text-teal-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-500">Seller rating: {listing.sellerRating.toFixed(1)} ⭐</p>
              </div>
              <span className="text-xs text-primary font-medium shrink-0 hover:underline cursor-pointer">View store</span>
            </div>
          </div>
        </div>

        {/* ── Tabs: Description / Reviews / Shipping ── */}
        <div className="mt-10">
          <Tabs defaultValue="description">
            <TabsList className="bg-white border border-gray-200 rounded-xl h-11 p-1 gap-1 w-full sm:w-auto">
              <TabsTrigger value="description" className="rounded-lg text-sm data-[state=active]:shadow-sm flex-1 sm:flex-none">
                Description
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg text-sm data-[state=active]:shadow-sm flex-1 sm:flex-none">
                Reviews ({listing.reviewCount.toLocaleString()})
              </TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-lg text-sm data-[state=active]:shadow-sm flex-1 sm:flex-none">
                Shipping
              </TabsTrigger>
            </TabsList>

            {/* Description */}
            <TabsContent value="description">
              <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-3">About this product</h3>
                <p className="text-gray-600 leading-relaxed">{listing.description}</p>
                {listing.colors && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 mb-1">Available colors</p>
                    <p className="text-sm text-gray-500">{listing.colors.join(", ")}</p>
                  </div>
                )}
                {listing.sizes && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-gray-800 mb-1">Available sizes</p>
                    <p className="text-sm text-gray-500">{listing.sizes.join(", ")}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews">
              <div className="mt-4 space-y-4">
                {/* Rating summary */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row gap-6 items-start">
                  <div className="text-center shrink-0">
                    <div className="text-5xl font-extrabold text-gray-900">{listing.rating.toFixed(1)}</div>
                    <div className="flex justify-center mt-1 mb-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(listing.rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{listing.reviewCount.toLocaleString()} reviews</p>
                  </div>
                  <div className="flex-1 w-full space-y-1.5">
                    <RatingBar label="5 ★" value={Math.round(listing.reviewCount * 0.62)} total={listing.reviewCount} />
                    <RatingBar label="4 ★" value={Math.round(listing.reviewCount * 0.23)} total={listing.reviewCount} />
                    <RatingBar label="3 ★" value={Math.round(listing.reviewCount * 0.09)} total={listing.reviewCount} />
                    <RatingBar label="2 ★" value={Math.round(listing.reviewCount * 0.04)} total={listing.reviewCount} />
                    <RatingBar label="1 ★" value={Math.round(listing.reviewCount * 0.02)} total={listing.reviewCount} />
                  </div>
                </div>

                {/* Review cards */}
                {listing.reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start gap-3">
                      <img
                        src={review.avatar}
                        alt={review.author}
                        className="w-10 h-10 rounded-full object-cover bg-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-gray-900">{review.author}</span>
                            {review.verified && (
                              <span className="text-[10px] text-teal-600 font-medium bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-100 flex items-center gap-0.5">
                                <BadgeCheck className="h-2.5 w-2.5" /> Verified
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{review.date}</span>
                        </div>
                        <div className="flex mt-1 mb-2">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                          ))}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">{review.title}</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Shipping */}
            <TabsContent value="shipping">
              <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Truck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {listing.freeShipping ? "Free Shipping" : "Standard Shipping"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Estimated delivery in {listing.shippingDays}–{listing.shippingDays + 2} business days.
                      Order before 2 PM for same-day dispatch.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-4">
                  <RotateCcw className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">30-Day Easy Returns</p>
                    <p className="text-sm text-gray-500">
                      Not satisfied? Return it within 30 days for a full refund. No questions asked.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-4">
                  <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Buyer Protection</p>
                    <p className="text-sm text-gray-500">
                      Every order is covered by NearBuy Buyer Protection. Pay securely and shop with confidence.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-extrabold text-gray-900 mb-5">You might also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <Link key={p.id} href={`/listing/${p.id}`} className="group block">
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {p.discount && (
                        <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          -{p.discount}%
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">
                        {p.title}
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold text-gray-900">${p.price.toLocaleString()}</span>
                        {p.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">${p.originalPrice.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(p.rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky mobile CTA */}
      <div className="lg:hidden sticky bottom-0 bg-white border-t border-gray-200 shadow-lg p-4 flex gap-3 z-20">
        <Button
          onClick={handleAddToCart}
          variant="outline"
          className="flex-1 h-12 font-semibold rounded-xl border-2 border-primary text-primary hover:bg-primary/5 gap-2"
        >
          <ShoppingCart className="h-5 w-5" />
          {addedToCart ? "Added!" : "Add to Cart"}
        </Button>
        <Button className="flex-1 h-12 font-semibold rounded-xl gap-2 bg-primary shadow-lg shadow-primary/25">
          <Zap className="h-5 w-5" />
          Buy Now
        </Button>
      </div>
    </div>
  );
}

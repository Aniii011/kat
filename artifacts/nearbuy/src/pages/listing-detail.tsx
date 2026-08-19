import React, { useState, useEffect, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListing, useListings } from "@/hooks/use-listings";
import { useCart } from "@/hooks/use-cart";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  ArrowLeft, Star, ShoppingBag, Shield, RotateCcw,
  Truck, BadgeCheck, ChevronLeft, ChevronRight, Minus, Plus,
  Heart, Share2, Users, Clock, Ruler, Info, Package,
  MessageCircle, Flag, ChevronDown, ChevronUp, Play,
  CheckCircle2, Store, Tag, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import AuthModal from "@/components/auth-modal";
import { useAuth } from "@/context/auth-context";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/20"}`} />
        ))}
      </div>
      <span className="text-sm font-bold">{rating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">({count.toLocaleString()})</span>
    </div>
  );
}

const TOPS_SIZE_GUIDE = [
  { size: "XXS", bust: "76-79", waist: "58-61", hip: "82-85" },
  { size: "XS", bust: "80-83", waist: "62-65", hip: "86-89" },
  { size: "S", bust: "84-87", waist: "66-69", hip: "90-93" },
  { size: "M", bust: "88-93", waist: "70-75", hip: "94-99" },
  { size: "L", bust: "94-99", waist: "76-81", hip: "100-105" },
  { size: "XL", bust: "100-107", waist: "82-89", hip: "106-113" },
  { size: "XXL", bust: "108-115", waist: "90-97", hip: "114-121" },
  { size: "3XL", bust: "116-124", waist: "98-106", hip: "122-130" },
];

const BOTTOMS_SIZE_GUIDE = [
  { size: "XXS", waist: "58-61", hip: "82-85", inseam: "74-76" },
  { size: "XS", waist: "62-65", hip: "86-89", inseam: "75-77" },
  { size: "S", waist: "66-69", hip: "90-93", inseam: "76-78" },
  { size: "M", waist: "70-75", hip: "94-99", inseam: "77-79" },
  { size: "L", waist: "76-81", hip: "100-105", inseam: "78-80" },
  { size: "XL", waist: "82-89", hip: "106-113", inseam: "79-81" },
  { size: "XXL", waist: "90-97", hip: "114-121", inseam: "80-82" },
  { size: "3XL", waist: "98-106", hip: "122-130", inseam: "81-83" },
];

const SHOE_SIZE_GUIDE = [
  { eu: "36", uk: "3", us: "5.5", cm: "23" },
  { eu: "37", uk: "4", us: "6.5", cm: "23.5" },
  { eu: "38", uk: "5", us: "7.5", cm: "24" },
  { eu: "39", uk: "6", us: "8.5", cm: "25" },
  { eu: "40", uk: "6.5", us: "9", cm: "25.5" },
  { eu: "41", uk: "7", us: "9.5", cm: "26" },
  { eu: "42", uk: "8", us: "10.5", cm: "27" },
  { eu: "43", uk: "9", us: "11.5", cm: "27.5" },
  { eu: "44", uk: "10", us: "12", cm: "28" },
  { eu: "45", uk: "11", us: "13", cm: "29" },
  { eu: "46", uk: "12", us: "14", cm: "30" },
];

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const [, navigate] = useLocation();
  const id = params?.id ?? null;

  const { listing, loading } = useListing(id);
  const { listings: relatedAll } = useListings();
  const { addItem, saveForLater, removeSaved, isSaved, isInCart } = useCart();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedShoeSize, setSelectedShoeSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeQA, setActiveQA] = useState<number | null>(null);
  const cartToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const related = listing
    ? relatedAll.filter((l) => l.id !== listing.id &&
        (l.category === listing.category ||
         l.aesthetics?.some((a) => listing.aesthetics?.includes(a)))
      ).slice(0, 6)
    : [];

  useEffect(() => {
    setSelectedImage(0);
    setSelectedColor(null);
    setSelectedSize(null);
    setSelectedShoeSize(null);
    setQuantity(1);
  }, [id]);

  useEffect(() => {
  if (!listing) return;
  try {
    const raw = localStorage.getItem("kat_recently_viewed");
    const prev = raw ? JSON.parse(raw) : [];
    const entry = { id: listing.id, title: listing.title, image_url: listing.imageUrl, price: listing.price };
    const next = [entry, ...prev.filter((p: any) => p.id !== listing.id)].slice(0, 20);
    localStorage.setItem("kat_recently_viewed", JSON.stringify(next));
  } catch {
    // localStorage unavailable — fail silently, doesn't affect page functionality
  }
}, [listing?.id]);
  
  useEffect(() => {
    if (!listing) return;
    if (selectedColor && listing.colorImages?.[selectedColor]) {
      const baseImages = listing.images.length > 0 ? listing.images : [listing.imageUrl];
      const idx = baseImages.indexOf(listing.colorImages[selectedColor]);
      if (idx >= 0) setSelectedImage(idx);
    }
  }, [selectedColor, listing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-14 border-b flex items-center px-4 gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-5 w-40 flex-1" />
        </div>
        <Skeleton className="w-full aspect-square" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-5xl mb-4">😕</p>
          <p className="font-bold text-lg">Item not found</p>
          <p className="text-sm text-muted-foreground mt-1">This product may have been removed.</p>
          <Link href="/"><Button variant="outline" size="sm" className="mt-4 rounded-full">Back to shop</Button></Link>
        </div>
      </div>
    );
  }

  const baseImages = listing.images.length > 0 ? listing.images : [listing.imageUrl];
  const colorOnlyImages = listing.colorImages
    ? Object.values(listing.colorImages).filter((url) => !baseImages.includes(url))
    : [];
  const images = [...baseImages, ...colorOnlyImages];

  const allClothingSizes = listing.clothingSizes ?? [];
  const allShoeSizes = listing.shoeSizes ?? [];
  const hasVariants = allClothingSizes.length > 0 || allShoeSizes.length > 0 || (listing.colors && listing.colors.length > 0);
  const isShoeSize = allShoeSizes.length > 0;

  const selectedVariantImage = selectedColor && listing.colorImages?.[selectedColor]
    ? listing.colorImages[selectedColor]
    : undefined;

const handleAddToCart = () => {
  if (!user) {
    setShowAuth(true);
    return;
  }
  addItem({
    listingId: listing.id,
    title: listing.title,
    price: listing.price,
    imageUrl: selectedVariantImage || listing.imageUrl,
    sellerName: listing.sellerName,
    quantity,
    selectedSize: selectedSize || selectedShoeSize || undefined,
    selectedColor: selectedColor || undefined,
    variantImage: selectedVariantImage,
  });
  setShowAddedToCart(true);
  if (cartToastRef.current) clearTimeout(cartToastRef.current);
  cartToastRef.current = setTimeout(() => setShowAddedToCart(false), 2500);
};

  const handleSaveForLater = () => {
    if (isSaved(listing.id)) {
      removeSaved(listing.id);
      setWishlisted(false);
    } else {
      saveForLater({
        listingId: listing.id,
        title: listing.title,
        price: listing.price,
        imageUrl: listing.imageUrl,
        sellerName: listing.sellerName,
      });
      setWishlisted(true);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: listing.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setShowShareSheet(true);
      setTimeout(() => setShowShareSheet(false), 2000);
    }
  };

  // Estimate delivery
  const today = new Date();
  const earliest = new Date(today); earliest.setDate(today.getDate() + (listing.shippingDays || 3));
  const latest = new Date(today); latest.setDate(today.getDate() + (listing.shippingDays || 3) + 2);
  const fmt = (d: Date) => d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  const deliveryEstimate = `${fmt(earliest)} – ${fmt(latest)}`;

  const mockQA = [
    { q: "Does this run true to size?", a: listing.customSizeNote || "Please refer to the size guide for accurate measurements." },
    { q: "How long does delivery take?", a: `Estimated delivery: ${deliveryEstimate}` },
    { q: "Is this item returnable?", a: listing.isThrift ? "Thrift items are non-refundable once payment is complete." : "Yes, within 14 days of delivery in original condition." },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* Added to cart toast */}
      <AnimatePresence>
        {showAddedToCart && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Added to cart!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share toast */}
      <AnimatePresence>
        {showShareSheet && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-xs font-bold px-4 py-2 rounded-full shadow-lg"
          >
            Link copied!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{listing.title}</p>
          </div>
          <ThemeSwitcher />
          <button
            onClick={handleSaveForLater}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0"
          >
            <Heart className={`w-4 h-4 ${wishlisted || isSaved(listing.id) ? "fill-primary text-primary" : ""}`} />
          </button>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">

        {/* Image Gallery */}
        <div className="relative bg-muted">
          <div className="aspect-square overflow-hidden relative bg-muted">
  <AnimatePresence mode="wait">
    <motion.img
      key={selectedImage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      src={images[selectedImage]}
      alt={listing.title}
      className="w-full h-full object-contain"
    />
  </AnimatePresence>

            {/* Image counter */}
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full">
              {selectedImage + 1}/{images.length}
            </div>

            {/* Badge */}
            {listing.badge && (
              <div className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full font-bold bg-primary text-primary-foreground">
                {listing.badge}
              </div>
            )}
            {listing.isThrift && (
              <div className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full font-bold bg-purple-500 text-white">
                Thrift Drop 💜
              </div>
            )}

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((p) => (p - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center shadow-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedImage((p) => (p + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center shadow-md"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-3 py-2">
              {images.map((img, i) => (
                <button
  key={i}
  onClick={() => setSelectedImage(i)}
  className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 bg-muted transition-all ${
    selectedImage === i ? "border-primary" : "border-transparent opacity-50 hover:opacity-80"
  }`}
>
  <img src={img} alt="" className="w-full h-full object-contain" />
</button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="px-4 py-4 space-y-4">

          {/* Title + sold count */}
          <div>
            <h1 className="text-lg font-black leading-tight">{listing.title}</h1>
            {listing.brand && <p className="text-xs text-muted-foreground mt-0.5">{listing.brand}</p>}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <StarRow rating={listing.rating || 0} count={listing.reviewCount || 0} />
              {listing.sold > 0 && (
                <span className="text-xs text-muted-foreground">
                  {listing.sold.toLocaleString()} sold
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 bg-primary/5 rounded-2xl px-4 py-3">
            <span className="text-2xl font-black text-primary">{formatNaira(listing.price)}</span>
            {listing.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{formatNaira(listing.originalPrice)}</span>
            )}
            {listing.discount && (
              <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                -{listing.discount}% OFF
              </span>
            )}
          </div>

          {/* Thrift deposit */}
          {listing.isThrift && listing.depositAmount && (
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">One-of-one — deposit to hold</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pay {formatNaira(listing.depositAmount)} deposit to secure for 24 hours.
              </p>
            </div>
          )}

          {/* Aesthetics tags */}
          {listing.aesthetics && listing.aesthetics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {listing.aesthetics.map((a) => (
                <span key={a} className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full font-semibold">
                  {a}
                </span>
              ))}
            </div>
          )}

          <Separator />

          {/* Color selector */}
          {listing.colors && listing.colors.length > 0 && (
            <div>
              <p className="text-sm font-bold mb-2">
                Colour{selectedColor && <span className="text-muted-foreground font-normal"> — {selectedColor}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {listing.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(selectedColor === c ? null : c)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
                      selectedColor === c
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {listing.colorImages?.[c] && (
                      <img src={listing.colorImages[c]} alt={c} className="w-4 h-4 rounded-full object-cover shrink-0" />
                    )}
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clothing size selector */}
          {allClothingSizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold">
                  Size{selectedSize && <span className="text-muted-foreground font-normal"> — {selectedSize}</span>}
                </p>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="flex items-center gap-1 text-xs text-primary font-semibold"
                >
                  <Ruler className="w-3 h-3" /> Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allClothingSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                    className={`text-xs min-w-[44px] h-10 px-2 rounded-xl border-2 font-semibold transition-all ${
                      selectedSize === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:border-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {listing.customSizeNote && (
                <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground bg-muted rounded-xl p-2.5">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{listing.customSizeNote}</span>
                </div>
              )}
            </div>
          )}

          {/* Shoe size selector */}
          {allShoeSizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold">
                  Shoe Size{selectedShoeSize && <span className="text-muted-foreground font-normal"> — EU {selectedShoeSize}</span>}
                </p>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="flex items-center gap-1 text-xs text-primary font-semibold"
                >
                  <Ruler className="w-3 h-3" /> Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allShoeSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedShoeSize(selectedShoeSize === s ? null : s)}
                    className={`text-xs min-w-[44px] h-10 px-2 rounded-xl border-2 font-semibold transition-all ${
                      selectedShoeSize === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:border-primary"
                    }`}
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
              <p className="text-sm font-bold mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-black text-base">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(listing.stockCount || 99, quantity + 1))}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                {listing.stockCount > 0 && (
                  <span className="text-xs text-muted-foreground">{listing.stockCount} in stock</span>
                )}
              </div>
            </div>
          )}

          {/* Stock warning */}
          {listing.stockCount > 0 && listing.stockCount <= 5 && !listing.isThrift && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800">
              <Zap className="w-3.5 h-3.5" />
              Only {listing.stockCount} left — order soon!
            </div>
          )}

          {/* Shipping estimate */}
          <div className="bg-muted rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold">
                  {listing.freeShipping ? "Free Delivery" : "Delivery fee calculated at checkout"}
                </p>
                <p className="text-[11px] text-muted-foreground">Estimated arrival: {deliveryEstimate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs font-semibold">
                {listing.isThrift ? "No returns on thrift items" : "14-day returns"}
              </p>
            </div>
          </div>

          {/* Protection badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Shield className="w-4 h-4 text-primary" />, label: "Buyer Protection" },
              { icon: <BadgeCheck className="w-4 h-4 text-primary" />, label: "Verified Seller" },
              { icon: <Package className="w-4 h-4 text-primary" />, label: "Secure Checkout" },
            ].map((b) => (
              <div key={b.label} className="bg-muted rounded-xl p-2.5 flex flex-col items-center gap-1 text-center">
                {b.icon}
                <span className="text-[10px] font-medium leading-tight">{b.label}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Seller mini-store */}
          <div className="bg-card border border-card-border rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {listing.sellerAvatar ? (
                  <img src={listing.sellerAvatar} alt={listing.sellerName} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <Store className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-sm truncate">{listing.sellerName || "KAT Seller"}</p>
                  {listing.isVerifiedSeller && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                </div>
                {listing.sellerFollowers && (
                  <p className="text-[11px] text-muted-foreground">
                    {listing.sellerFollowers.toLocaleString()} followers
                  </p>
                )}
                <div className="flex mt-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < Math.floor(listing.sellerRating || 0) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                  ))}
                  {listing.sellerRating > 0 && (
                    <span className="text-[10px] text-muted-foreground ml-1">{listing.sellerRating.toFixed(1)}</span>
                  )}
                </div>
              </div>
              <Link href={`/store/${listing.sellerId}`}>
                <Button variant="outline" size="sm" className="rounded-full text-xs border-primary text-primary hover:bg-primary/10 shrink-0">
                  Visit Store
                </Button>
              </Link>
            </div>
          </div>

          {/* Q&A */}
          <div className="space-y-2">
            <p className="text-sm font-bold">Product Q&A</p>
            {mockQA.map((item, i) => (
              <div key={i} className="bg-card border border-card-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setActiveQA(activeQA === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left gap-2"
                >
                  <span className="flex-1">{item.q}</span>
                  {activeQA === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                <AnimatePresence>
                  {activeQA === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-3 text-sm text-muted-foreground">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description">
            <TabsList className="rounded-full bg-muted p-1 h-auto w-full">
              <TabsTrigger value="description" className="rounded-full text-xs px-3 py-1.5 flex-1">Description</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-full text-xs px-3 py-1.5 flex-1">
                Reviews ({listing.reviews?.length ?? listing.reviewCount ?? 0})
              </TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-full text-xs px-3 py-1.5 flex-1">Shipping</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-3">
              <div className="bg-card border border-card-border rounded-2xl p-4">
                <div className={`text-sm text-muted-foreground leading-relaxed overflow-hidden transition-all ${descExpanded ? "" : "max-h-24"}`}>
                  {listing.description || "No description provided."}
                </div>
                {listing.description && listing.description.length > 150 && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="text-xs text-primary font-semibold mt-2 flex items-center gap-1"
                  >
                    {descExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                  </button>
                )}
                {listing.tags && listing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {listing.tags.map((t) => (
                      <span key={t} className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />#{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-3 space-y-3">
              {listing.reviews && listing.reviews.length > 0 ? (
                listing.reviews.map((r) => (
                  <div key={r.id} className="bg-card border border-card-border rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-primary">
                          {r.author.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
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
                        <div className="flex mt-1 mb-1.5">
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
                <div className="text-center py-10 bg-card border border-card-border rounded-2xl">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No reviews yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Be the first to review this item</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="shipping" className="mt-3">
              <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{listing.freeShipping ? "Free Delivery" : "Standard Delivery"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {listing.freeShipping ? "" : "Delivery fee is calculated at checkout based on your area. "}
                      Estimated delivery: {deliveryEstimate}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{listing.isThrift ? "No Returns" : "14-Day Returns"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {listing.isThrift
                        ? "Thrift items are sold as-is and cannot be returned once paid."
                        : "Items must be unworn with original packaging and tags attached."}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Buyer Protection</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Full refund if item is not as described.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Report */}
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Flag className="w-3.5 h-3.5" /> Report this item
          </button>

          {/* Related Products */}
          {related.length > 0 && (
            <section className="mt-2">
              <p className="text-sm font-black mb-3">You might also love ✨</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {related.map((item) => (
                  <Link key={item.id} href={`/listing/${item.id}`}>
                    <div className="group rounded-2xl overflow-hidden bg-card border border-card-border hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            addItem({
                              listingId: item.id,
                              title: item.title,
                              price: item.price,
                              imageUrl: item.imageUrl,
                              sellerName: item.sellerName,
                              quantity: 1,
                            });
                          }}
                          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-primary-foreground" />
                        </button>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold line-clamp-2 leading-tight">{item.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm font-black text-primary">{formatNaira(item.price)}</p>
                          {item.rating > 0 && (
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-[10px] text-muted-foreground">{item.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-[62px] left-0 right-0 z-30 bg-background/98 backdrop-blur-md border-t border-border px-4 py-3 sm:hidden">
        <div className="max-w-lg mx-auto">
          {listing.isThrift ? (
            <Button
              className="w-full rounded-full font-bold bg-purple-500 hover:bg-purple-600 border-0 h-12"
              onClick={() => setShowDeposit(true)}
            >
              💜 Pay Deposit — {formatNaira(listing.depositAmount ?? 0)}
            </Button>
          ) : (
            <Button
              className="w-full rounded-full font-bold h-12 gap-2"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="w-4 h-4" /> Add to Cart — {formatNaira(listing.price * quantity)}
            </Button>
          )}
        </div>
      </div>

      {/* Desktop sticky CTA */}
      <div className="hidden sm:block fixed bottom-0 left-0 right-0 z-30 bg-background/98 backdrop-blur-md border-t border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button
            variant="outline"
            className="rounded-full font-bold h-12 px-6 border-primary text-primary hover:bg-primary/10"
            onClick={handleSaveForLater}
          >
            <Heart className={`w-4 h-4 mr-2 ${wishlisted || isSaved(listing.id) ? "fill-primary" : ""}`} />
            {wishlisted || isSaved(listing.id) ? "Saved" : "Save"}
          </Button>
          {listing.isThrift ? (
            <Button
              className="flex-1 rounded-full font-bold bg-purple-500 hover:bg-purple-600 border-0 h-12"
              onClick={() => setShowDeposit(true)}
            >
              💜 Pay Deposit — {formatNaira(listing.depositAmount ?? 0)}
            </Button>
          ) : (
            <Button
              className="flex-1 rounded-full font-bold h-12 gap-2"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="w-4 h-4" /> Add to Cart — {formatNaira(listing.price * quantity)}
            </Button>
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
              <p className="text-xs text-muted-foreground mt-1">Deposit (deducted from total)</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p>✓ Item held exclusively for you for 24 hours</p>
              <p>✓ Deposit deducted from final price of {formatNaira(listing.price)}</p>
              <p>✓ Refundable if item is misrepresented</p>
            </div>
            <Button className="w-full rounded-full font-bold bg-purple-500 hover:bg-purple-600 border-0 h-12">
              Pay Deposit
            </Button>
            <Button variant="ghost" size="sm" className="w-full rounded-full text-xs" onClick={() => setShowDeposit(false)}>
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-black">Report This Item</DialogTitle>
            <DialogDescription>Why are you reporting this listing?</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {["Fake or counterfeit item", "Wrong item described", "Inappropriate content", "Suspected scam", "Other"].map((reason) => (
              <button
                key={reason}
                onClick={() => setShowReport(false)}
                className="w-full text-left text-sm px-4 py-3 rounded-xl bg-muted hover:bg-accent transition-colors font-medium"
              >
                {reason}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Size guide dialog */}
      <Dialog open={showSizeGuide} onOpenChange={setShowSizeGuide}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" /> Size Guide
            </DialogTitle>
            <DialogDescription className="text-xs">All measurements in centimetres (cm).</DialogDescription>
          </DialogHeader>

          {isShoeSize ? (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-[11px] font-bold text-muted-foreground px-2">
                <span>EU</span><span>UK</span><span>US</span><span>Foot cm</span>
              </div>
              {SHOE_SIZE_GUIDE.map((row) => (
                <div key={row.eu} className="grid grid-cols-4 gap-2 text-sm bg-muted rounded-xl px-2 py-2">
                  <span className="font-bold">{row.eu}</span>
                  <span>{row.uk}</span>
                  <span>{row.us}</span>
                  <span>{row.cm}</span>
                </div>
              ))}
            </div>
          ) : (
            <Tabs defaultValue="tops">
              <TabsList className="rounded-full bg-muted p-1 h-auto w-full">
                <TabsTrigger value="tops" className="rounded-full text-xs px-4 py-1.5 flex-1">Tops & Dresses</TabsTrigger>
                <TabsTrigger value="bottoms" className="rounded-full text-xs px-4 py-1.5 flex-1">Bottoms</TabsTrigger>
              </TabsList>
              <TabsContent value="tops" className="mt-3 space-y-2">
                <div className="grid grid-cols-4 gap-2 text-[11px] font-bold text-muted-foreground px-2">
                  <span>Size</span><span>Bust</span><span>Waist</span><span>Hip</span>
                </div>
                {TOPS_SIZE_GUIDE.map((row) => (
                  <div key={row.size} className="grid grid-cols-4 gap-2 text-sm bg-muted rounded-xl px-2 py-2">
                    <span className="font-bold">{row.size}</span>
                    <span>{row.bust}</span>
                    <span>{row.waist}</span>
                    <span>{row.hip}</span>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="bottoms" className="mt-3 space-y-2">
                <div className="grid grid-cols-4 gap-2 text-[11px] font-bold text-muted-foreground px-2">
                  <span>Size</span><span>Waist</span><span>Hip</span><span>Inseam</span>
                </div>
                {BOTTOMS_SIZE_GUIDE.map((row) => (
                  <div key={row.size} className="grid grid-cols-4 gap-2 text-sm bg-muted rounded-xl px-2 py-2">
                    <span className="font-bold">{row.size}</span>
                    <span>{row.waist}</span>
                    <span>{row.hip}</span>
                    <span>{row.inseam}</span>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} defaultMode="login" />
    </div>
  );
}

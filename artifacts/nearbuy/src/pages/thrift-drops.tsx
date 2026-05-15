import React, { useState } from "react";
import { Link } from "wouter";
import { useListings } from "@/hooks/use-listings";
import { listings as staticListings, type Listing } from "@/data/listings";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  ArrowLeft, Heart, Star, BadgeCheck, Recycle,
  ShoppingBag, Clock, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function ThriftCard({ listing, wishlisted, onWishlist, onDeposit }: {
  listing: Listing;
  wishlisted: boolean;
  onWishlist: (e: React.MouseEvent) => void;
  onDeposit: () => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-card border border-card-border shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Link href={`/listing/${listing.id}`}>
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105 cursor-pointer"
            loading="lazy"
          />
        </Link>
        <span className="absolute top-2 left-2 text-[10px] px-2.5 py-1 rounded-full font-bold bg-purple-500 text-white">
          1 of 1 💜
        </span>
        <button
          onClick={onWishlist}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${wishlisted ? "bg-primary" : "bg-white/90 hover:bg-white"}`}
        >
          <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-white text-white" : "text-gray-500"}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-white font-bold text-sm leading-tight line-clamp-2">{listing.title}</p>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <p className="text-[11px] text-muted-foreground truncate flex-1">{listing.sellerName}</p>
          {listing.isVerifiedSeller && <BadgeCheck className="w-3 h-3 text-primary shrink-0" />}
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < Math.floor(listing.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
          ))}
          <span className="text-[10px] text-muted-foreground ml-0.5">({listing.reviewCount})</span>
        </div>

        {listing.clothingSizes && (
          <div className="flex items-center gap-1 flex-wrap">
            {listing.clothingSizes.map((s) => (
              <span key={s} className="text-[10px] border border-border rounded-full px-2 py-0.5 text-muted-foreground">{s}</span>
            ))}
          </div>
        )}

        <div className="flex items-baseline gap-2">
          <span className="font-bold text-primary">{formatNaira(listing.price)}</span>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-purple-500" />
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">Deposit required</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Pay {listing.depositAmount ? formatNaira(listing.depositAmount) : "a deposit"} to secure this one-of-one piece while you arrange payment.</p>
        </div>

        <Button
          size="sm"
          className="w-full rounded-full text-xs font-bold bg-purple-500 hover:bg-purple-600 text-white border-0"
          onClick={onDeposit}
        >
          💜 Pay Deposit — {listing.depositAmount ? formatNaira(listing.depositAmount) : "Secure Now"}
        </Button>
      </div>
    </div>
  );
}

export default function ThriftDrops() {
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [depositListing, setDepositListing] = useState<Listing | null>(null);

  const { listings: remoteListings, loading, error } = useListings();
  const allListings = remoteListings.length > 0 ? remoteListings : staticListings;
  const thriftListings = allListings.filter((l) => l.isThrift);

  const toggleWishlist = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-black">💜 Thrift Drops</h1>
          </div>
          <ThemeSwitcher />
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
            <ShoppingBag className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-pink-400/20 border border-purple-300/30 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shrink-0 shadow-lg">
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">One-of-One Finds</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Rare vintage and pre-loved pieces. Each item is one-of-a-kind — once it's gone, it's gone. 
                Place a deposit to hold your piece while you complete checkout.
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-500" /> How Thrift Drops Work
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: "1", title: "Find your piece", desc: "Browse one-of-one thrift items" },
              { step: "2", title: "Pay deposit", desc: "Secure the item with a small deposit" },
              { step: "3", title: "Complete payment", desc: "Pay the balance within 24hrs" },
            ].map((s) => (
              <div key={s.step} className="bg-card border border-card-border rounded-2xl p-3 text-center">
                <div className="w-7 h-7 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">{s.step}</div>
                <p className="text-xs font-semibold leading-tight">{s.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">
            {thriftListings.length} drop{thriftListings.length !== 1 ? "s" : ""} available
          </p>
          <span className="text-[10px] bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 px-2.5 py-1 rounded-full font-semibold dripp-pulse">
            🔄 Updated daily
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card border border-card-border">
                <Skeleton className="aspect-[3/4]" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : thriftListings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💜</div>
            <p className="font-bold text-base">No drops right now</p>
            <p className="text-sm text-muted-foreground mt-1">New thrift drops are added daily — check back soon!</p>
            <Link href="/">
              <Button variant="outline" size="sm" className="mt-4 rounded-full">Browse main store</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {thriftListings.map((listing) => (
              <ThriftCard
                key={listing.id}
                listing={listing}
                wishlisted={wishlist.has(listing.id)}
                onWishlist={(e) => toggleWishlist(e, listing.id)}
                onDeposit={() => setDepositListing(listing)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Deposit dialog */}
      <Dialog open={!!depositListing} onOpenChange={() => setDepositListing(null)}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-black">💜 Secure Your Piece</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Pay a refundable deposit to hold <strong>{depositListing?.title}</strong> for 24 hours while you arrange full payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {depositListing?.depositAmount ? formatNaira(depositListing.depositAmount) : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Deposit amount (deducted from total)</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ Item held exclusively for you for 24 hours</p>
              <p>✓ Deposit deducted from final price</p>
              <p>✓ Fully refundable if item condition misrepresented</p>
            </div>
            <Button className="w-full rounded-full font-bold bg-purple-500 hover:bg-purple-600 border-0">
              Pay Deposit via Transfer / Card
            </Button>
            <Button variant="ghost" size="sm" className="w-full rounded-full text-xs" onClick={() => setDepositListing(null)}>
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

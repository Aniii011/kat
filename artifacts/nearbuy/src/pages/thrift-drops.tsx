import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListings } from "@/hooks/use-listings";
import { listings as staticListings, type Listing } from "@/data/listings";
import { useThriftHolds, type HoldStatus } from "@/hooks/use-thrift-holds";
import { useBoards } from "@/hooks/use-boards";
import ThemeSwitcher from "@/components/theme-switcher";
import SaveToBoardModal from "@/components/save-to-board-modal";
import {
  ArrowLeft, Star, BadgeCheck, Recycle, ShoppingBag,
  Clock, Info, Heart, Timer, CheckCircle2, Lock, Unlock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function StatusBadge({ status }: { status: HoldStatus }) {
  if (status === "available") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
        <Unlock className="w-2.5 h-2.5" /> Available
      </span>
    );
  }
  if (status === "held_by_me") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
        <Lock className="w-2.5 h-2.5" /> Held by you
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
      <CheckCircle2 className="w-2.5 h-2.5" /> Sold
    </span>
  );
}

function ThriftCard({
  listing,
  status,
  timeRemaining,
  onHold,
  onComplete,
  onRelease,
  onSave,
  saved,
}: {
  listing: Listing;
  status: HoldStatus;
  timeRemaining: string;
  onHold: () => void;
  onComplete: () => void;
  onRelease: () => void;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col rounded-3xl overflow-hidden bg-card border border-card-border shadow-sm transition-all duration-300 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Link href={`/listing/${listing.id}`}>
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
            loading="lazy"
          />
        </Link>

        {/* Overlay when held */}
        <AnimatePresence>
          {status === "held_by_me" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex items-center justify-center"
            >
              <div className="bg-background/90 rounded-2xl px-4 py-3 text-center shadow-lg">
                <Timer className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                <p className="text-xs font-black text-amber-600">Held by you</p>
                <p className="text-lg font-black font-mono text-amber-500 mt-0.5">{timeRemaining}</p>
                <p className="text-[10px] text-muted-foreground">time remaining</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-purple-500 text-white">1 of 1 💜</span>
          <StatusBadge status={status} />
        </div>

        {/* Save button */}
        <button
          onClick={onSave}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
            saved ? "bg-primary" : "bg-white/90 hover:bg-white"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${saved ? "fill-white text-white" : "text-gray-500"}`} />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-[11px] text-muted-foreground truncate flex-1">{listing.sellerName}</p>
          {listing.isVerifiedSeller && <BadgeCheck className="w-3 h-3 text-primary shrink-0" />}
        </div>

        <Link href={`/listing/${listing.id}`}>
          <p className="text-sm font-bold leading-tight line-clamp-2 cursor-pointer hover:text-primary transition-colors">{listing.title}</p>
        </Link>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < Math.floor(listing.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
          ))}
          <span className="text-[10px] text-muted-foreground">({listing.reviewCount})</span>
        </div>

        {listing.clothingSizes && (
          <div className="flex flex-wrap gap-1">
            {listing.clothingSizes.map((s) => (
              <span key={s} className="text-[9px] border border-border rounded-full px-2 py-0.5 text-muted-foreground">{s}</span>
            ))}
          </div>
        )}

        <div className="flex items-baseline gap-2">
          <span className="font-black text-primary">{formatNaira(listing.price)}</span>
        </div>

        {/* Deposit info */}
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-purple-500" />
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
              Deposit: {listing.depositAmount ? formatNaira(listing.depositAmount) : "required"}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Pay deposit to hold this piece for 24 hours.
          </p>
        </div>

        {/* CTA */}
        {status === "available" && (
          <Button
            size="sm"
            className="w-full rounded-full text-xs font-bold bg-purple-500 hover:bg-purple-600 border-0 mt-auto"
            onClick={onHold}
          >
            💜 Hold — {listing.depositAmount ? formatNaira(listing.depositAmount) : "Deposit"}
          </Button>
        )}

        {status === "held_by_me" && (
          <div className="space-y-1.5 mt-auto">
            <Button
              size="sm"
              className="w-full rounded-full text-xs font-bold bg-emerald-500 hover:bg-emerald-600 border-0"
              onClick={onComplete}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Complete Purchase
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full rounded-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onRelease}
            >
              Release hold
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ThriftDrops() {
  const [depositListing, setDepositListing] = useState<Listing | null>(null);
  const [completeListing, setCompleteListing] = useState<Listing | null>(null);
  const [saveTarget, setSaveTarget] = useState<number | null>(null);

  const { listings: remoteListings, loading } = useListings();
  const allListings = remoteListings.length > 0 ? remoteListings : staticListings;
  const thriftListings = allListings.filter((l) => l.isThrift);

  const { holdItem, releaseHold, getStatus, getTimeRemaining } = useThriftHolds();
  const { isSaved } = useBoards();

  const confirmHold = () => {
    if (!depositListing) return;
    holdItem(depositListing.id, depositListing.depositAmount ?? 0);
    setDepositListing(null);
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-pink-400/20 border border-purple-300/30 p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shrink-0 shadow-lg">
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black">One-of-One Finds</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Rare vintage and pre-loved pieces. Each item is unique — once it's gone, it's gone.
                Pay a deposit to hold your piece while you complete checkout.
              </p>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-500" /> How Thrift Drops Work
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: "1", icon: "🔍", title: "Find your piece", desc: "Browse one-of-one thrift items" },
              { step: "2", icon: "💜", title: "Pay deposit", desc: "Hold the item for 24 hours" },
              { step: "3", icon: "✅", title: "Complete payment", desc: "Pay balance & it's yours" },
            ].map((s) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Number(s.step) * 0.1 }}
                className="bg-card border border-card-border rounded-2xl p-3 text-center"
              >
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-xs font-semibold leading-tight">{s.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hold states legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { status: "available" as HoldStatus, label: "Available to hold" },
            { status: "held_by_me" as HoldStatus, label: "You're holding this" },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1.5">
              <StatusBadge status={status} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">
            {thriftListings.length} drop{thriftListings.length !== 1 ? "s" : ""} available
          </p>
          <span className="text-[10px] bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 px-2.5 py-1 rounded-full font-semibold">
            🔄 Updated daily
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden bg-card border border-card-border">
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
            <p className="text-sm text-muted-foreground mt-1">New thrift drops added daily — check back soon!</p>
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
                status={getStatus(listing.id)}
                timeRemaining={getTimeRemaining(listing.id)}
                onHold={() => setDepositListing(listing)}
                onComplete={() => setCompleteListing(listing)}
                onRelease={() => releaseHold(listing.id)}
                onSave={() => setSaveTarget(listing.id)}
                saved={isSaved(listing.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Hold confirmation dialog */}
      <Dialog open={!!depositListing} onOpenChange={() => setDepositListing(null)}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-black">💜 Hold this piece</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Pay a deposit to secure <strong>{depositListing?.title}</strong> for <strong>24 hours</strong> while you arrange full payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
                {depositListing?.depositAmount ? formatNaira(depositListing.depositAmount) : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Deposit amount (deducted from total)</p>
            </div>
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-3 border border-amber-200 dark:border-amber-800">
              <Timer className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">24-hour hold begins now</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  If not completed within 24 hours, item is released back to the public.
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ Exclusively held for you during hold period</p>
              <p>✓ Deposit deducted from final price of {depositListing ? formatNaira(depositListing.price) : ""}</p>
              <p>✓ Refundable if item condition is misrepresented</p>
            </div>
            <Button
              className="w-full rounded-full font-bold bg-purple-500 hover:bg-purple-600 border-0 h-12"
              onClick={confirmHold}
            >
              Confirm Hold &amp; Pay Deposit
            </Button>
            <Button variant="ghost" size="sm" className="w-full rounded-full text-xs" onClick={() => setDepositListing(null)}>
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete purchase dialog */}
      <Dialog open={!!completeListing} onOpenChange={() => setCompleteListing(null)}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-black">✅ Complete Purchase</DialogTitle>
            <DialogDescription className="text-center text-sm">
              You're about to complete payment for <strong>{completeListing?.title}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-muted-foreground">Item price</span>
                <span className="font-semibold">{completeListing ? formatNaira(completeListing.price) : ""}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-muted-foreground">Deposit already paid</span>
                <span className="font-semibold text-emerald-600">-{completeListing?.depositAmount ? formatNaira(completeListing.depositAmount) : ""}</span>
              </div>
              <div className="border-t border-emerald-200 dark:border-emerald-700 pt-2 flex justify-between items-center">
                <span className="font-bold">Balance due</span>
                <span className="font-black text-primary text-lg">
                  {completeListing ? formatNaira(completeListing.price - (completeListing.depositAmount ?? 0)) : ""}
                </span>
              </div>
            </div>
            <Button className="w-full rounded-full font-bold h-12" onClick={() => setCompleteListing(null)}>
              Pay Balance &amp; Finalise
            </Button>
            <Button variant="ghost" size="sm" className="w-full rounded-full text-xs" onClick={() => setCompleteListing(null)}>
              Pay later (hold remains active)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {saveTarget !== null && (
        <SaveToBoardModal
          open={saveTarget !== null}
          onClose={() => setSaveTarget(null)}
          listingId={saveTarget}
        />
      )}
    </div>
  );
}

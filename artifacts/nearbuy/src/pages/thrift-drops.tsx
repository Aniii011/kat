import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListings } from "@/hooks/use-listings";
import { type Listing } from "@/data/listings";
import { useThriftHolds, type HoldStatus } from "@/hooks/use-thrift-holds";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  ArrowLeft, Star, BadgeCheck, Recycle, ShoppingBag,
  Clock, Info, Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

type FilterTab = "available" | "held_by_me" | "holding";

function ThriftCard({ listing, status, timeRemaining }: {
  listing: Listing;
  status: HoldStatus;
  timeRemaining: string;
}) {
  return (
    <Link href={`/listing/${listing.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative flex flex-col rounded-3xl overflow-hidden bg-card border border-card-border shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {status === "held_by_me" && (
            <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex items-center justify-center">
              <div className="bg-background/90 rounded-2xl px-4 py-3 text-center shadow-lg">
                <Timer className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                <p className="text-xs font-black text-amber-600">You're holding this</p>
                <p className="text-lg font-black font-mono text-amber-500 mt-0.5">{timeRemaining}</p>
                <p className="text-[10px] text-muted-foreground">remaining</p>
              </div>
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-purple-500 text-white">
              1 of 1 💜
            </span>
            {status === "available" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500 text-white">
                Available
              </span>
            )}
            {status === "held_by_me" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500 text-white">
                Holding ⏳
              </span>
            )}
          </div>
        </div>

        <div className="p-3 flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-[11px] text-muted-foreground truncate flex-1">{listing.sellerName}</p>
            {listing.isVerifiedSeller && <BadgeCheck className="w-3 h-3 text-primary shrink-0" />}
          </div>
          <p className="text-sm font-bold leading-tight line-clamp-2">{listing.title}</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < Math.floor(listing.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
            ))}
            <span className="text-[10px] text-muted-foreground">({listing.reviewCount})</span>
          </div>
          {listing.clothingSizes && listing.clothingSizes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {listing.clothingSizes.map((s) => (
                <span key={s} className="text-[9px] border border-border rounded-full px-2 py-0.5 text-muted-foreground">{s}</span>
              ))}
            </div>
          )}
          <span className="font-black text-primary">{formatNaira(listing.price)}</span>
          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                Deposit: {listing.depositAmount ? formatNaira(listing.depositAmount) : "required"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">
              {status === "held_by_me"
                ? `Held for ${timeRemaining} — tap to complete purchase`
                : "Tap to hold this piece for 24 hours"}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function ThriftDrops() {
  const [activeTab, setActiveTab] = useState<FilterTab>("available");
  const { listings: remoteListings, loading } = useListings();
  const thriftListings = remoteListings.filter((l) => l.isThrift);
  const { getStatus, getTimeRemaining } = useThriftHolds();

  const availableListings = thriftListings.filter((l) => getStatus(l.id) === "available");
  const holdingListings = thriftListings.filter((l) => getStatus(l.id) === "held_by_me");

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "available", label: "Available to hold", count: availableListings.length },
    { key: "held_by_me", label: "Held by you", count: 0 },
    { key: "holding", label: "You're holding this", count: holdingListings.length },
  ];

  const displayedListings =
    activeTab === "available" ? availableListings :
    activeTab === "holding" ? holdingListings :
    [];

  return (
    <div className="min-h-screen bg-background">

      {/* Header — just title and icons, no tabs */}
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
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ShoppingBag className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-pink-400/20 border border-purple-300/30 p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shrink-0 shadow-lg">
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black">One-of-One Finds</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Rare vintage and pre-loved pieces. Pay a deposit to hold your piece for 24 hours.
              </p>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-500" /> How it works
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "🔍", title: "Find your piece", desc: "Browse one-of-one thrift items" },
              { icon: "💜", title: "Pay deposit", desc: "Hold the item for 24 hours" },
              { icon: "✅", title: "Complete payment", desc: "Pay balance & it's yours" },
            ].map((s, i) => (
              <div key={i} className="bg-card border border-card-border rounded-2xl p-3 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-xs font-semibold leading-tight">{s.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs — NOW below hero and how it works */}
        <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-background text-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">
            {displayedListings.length} item{displayedListings.length !== 1 ? "s" : ""}
          </p>
          <span className="text-[10px] bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 px-2.5 py-1 rounded-full font-semibold">
            🔄 Updated daily
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
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
        ) : displayedListings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💜</div>
            <p className="font-bold text-base">
              {activeTab === "holding" ? "You're not holding anything right now" :
               activeTab === "held_by_me" ? "No previously held items" :
               "No drops right now"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === "available" ? "New thrift drops added daily — check back soon!" :
               "Browse available items to find something you love"}
            </p>
            {activeTab !== "available" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full"
                onClick={() => setActiveTab("available")}
              >
                Browse available drops
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {displayedListings.map((listing) => (
              <ThriftCard
                key={listing.id}
                listing={listing}
                status={getStatus(listing.id)}
                timeRemaining={getTimeRemaining(listing.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
            }

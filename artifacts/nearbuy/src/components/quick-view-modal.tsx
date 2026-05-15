import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { type Listing } from "@/data/listings";
import { X, Star, Heart, ShoppingBag, Zap, BadgeCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SaveToBoardModal from "@/components/save-to-board-modal";
import { useBoards } from "@/hooks/use-boards";

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

interface Props {
  listing: Listing | null;
  onClose: () => void;
}

export default function QuickViewModal({ listing, onClose }: Props) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSaveBoard, setShowSaveBoard] = useState(false);
  const { isSaved } = useBoards();

  if (!listing) return null;

  const sizes = listing.clothingSizes ?? listing.shoeSizes ?? [];
  const sizeLabel = listing.shoeSizes ? "Shoe" : "Size";
  const saved = isSaved(listing.id);

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          key="sheet"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="w-full sm:max-w-lg bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted mx-auto sm:hidden" />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex gap-4 px-4 pb-4">
            {/* Image */}
            <div className="w-32 h-44 rounded-2xl overflow-hidden bg-muted shrink-0">
              <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
              {listing.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary text-primary-foreground">
                  {listing.badge}
                </span>
              )}
              <div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                  {listing.sellerName}
                  {listing.isVerifiedSeller && <BadgeCheck className="w-3 h-3 text-primary inline" />}
                </p>
                <p className="text-sm font-bold leading-tight line-clamp-2 mt-0.5">{listing.title}</p>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < Math.floor(listing.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">({listing.reviewCount})</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-black text-primary">{formatNaira(listing.price)}</span>
                {listing.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">{formatNaira(listing.originalPrice)}</span>
                )}
              </div>

              {listing.colors && listing.colors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {listing.colors.slice(0, 3).map((c) => (
                    <span key={c} className="text-[9px] border border-border rounded-full px-1.5 py-0.5">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">{sizeLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                    className={`text-xs w-9 h-9 rounded-xl border-2 font-semibold transition-all ${
                      selectedSize === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={() => setShowSaveBoard(true)}
              className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
                saved ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary hover:text-primary"
              }`}
            >
              <Heart className={`w-4 h-4 ${saved ? "fill-primary" : ""}`} />
            </button>
            <Button variant="outline" size="sm" className="flex-1 rounded-xl font-semibold border-primary text-primary hover:bg-primary/10">
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Add to Bag
            </Button>
            <Link href={`/listing/${listing.id}`} onClick={onClose}>
              <Button size="sm" className="flex-1 rounded-xl font-semibold gap-1.5 whitespace-nowrap">
                Full Details <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {showSaveBoard && (
        <SaveToBoardModal
          key="save-modal"
          open={showSaveBoard}
          onClose={() => setShowSaveBoard(false)}
          listingId={listing.id}
          listingTitle={listing.title}
        />
      )}
    </AnimatePresence>
  );
}

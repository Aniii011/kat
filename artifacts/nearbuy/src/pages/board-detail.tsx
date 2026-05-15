import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useBoards } from "@/hooks/use-boards";
import { listings as staticListings, type Listing } from "@/data/listings";
import ThemeSwitcher from "@/components/theme-switcher";
import QuickViewModal from "@/components/quick-view-modal";
import SaveToBoardModal from "@/components/save-to-board-modal";
import { ArrowLeft, Heart, Star, BadgeCheck, BookmarkX } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function aspectClass(id: number) {
  const r = id % 4;
  if (r === 0) return "aspect-square";
  if (r === 1) return "aspect-[3/4]";
  if (r === 2) return "aspect-[2/3]";
  return "aspect-[4/5]";
}

export default function BoardDetail() {
  const [, params] = useRoute("/boards/:id");
  const boardId = params?.id ?? "";

  const { boards, removeFromBoard, isSaved } = useBoards();
  const board = boards.find((b) => b.id === boardId);

  const [quickView, setQuickView] = useState<Listing | null>(null);
  const [saveTarget, setSaveTarget] = useState<Listing | null>(null);

  if (!board) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📌</p>
          <p className="font-bold text-lg">Board not found</p>
          <Link href="/boards">
            <Button variant="outline" size="sm" className="mt-4 rounded-full">Back to boards</Button>
          </Link>
        </div>
      </div>
    );
  }

  const items = board.itemIds
    .map((id) => staticListings.find((l) => l.id === id))
    .filter(Boolean) as Listing[];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/boards">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-black flex items-center gap-1.5">
              <span>{board.emoji}</span> {board.name}
            </h1>
            <p className="text-[11px] text-muted-foreground">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 py-4 pb-24">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{board.emoji}</div>
            <p className="font-bold text-base">Nothing saved yet</p>
            <p className="text-sm text-muted-foreground mt-1">Browse the shop and save items to this board</p>
            <Link href="/">
              <Button size="sm" className="mt-4 rounded-full">Browse shop</Button>
            </Link>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
            {items.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="break-inside-avoid mb-3"
              >
                <div className="group relative bg-card border border-card-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                  {/* Image */}
                  <div
                    className={`relative ${aspectClass(listing.id)} overflow-hidden bg-muted cursor-pointer`}
                    onClick={() => setQuickView(listing)}
                  >
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {listing.isThrift && (
                      <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full font-bold bg-purple-500 text-white">Thrift 💜</span>
                    )}
                    {listing.discount && (
                      <span className="absolute bottom-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">-{listing.discount}%</span>
                    )}
                    {/* Remove from board */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromBoard(board.id, listing.id); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      title="Remove from board"
                    >
                      <BookmarkX className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
                      {listing.sellerName}
                      {listing.isVerifiedSeller && <BadgeCheck className="w-2.5 h-2.5 text-primary inline shrink-0" />}
                    </p>
                    <p className="text-xs font-semibold leading-tight line-clamp-2 mt-0.5 cursor-pointer" onClick={() => setQuickView(listing)}>
                      {listing.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-medium">{listing.rating}</span>
                    </div>
                    <p className="text-xs font-black text-primary mt-1">{formatNaira(listing.price)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <QuickViewModal listing={quickView} onClose={() => setQuickView(null)} />
      {saveTarget && (
        <SaveToBoardModal
          open={!!saveTarget}
          onClose={() => setSaveTarget(null)}
          listingId={saveTarget.id}
          listingTitle={saveTarget.title}
        />
      )}
    </div>
  );
}

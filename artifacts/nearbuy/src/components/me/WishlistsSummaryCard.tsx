import { Link } from "wouter";
import { Gift, Plus, ChevronRight } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { Button } from "@/components/ui/button";
import WishlistPreviewCard from "./WishlistPreviewCard";

const PREVIEW_COUNT = 3;

interface WishlistsSummaryCardProps {
  userId: string;
}

export default function WishlistsSummaryCard({ userId }: WishlistsSummaryCardProps) {
  const { wishlists, loading } = useWishlist(userId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" /> Wishlists
        </p>
        {wishlists.length > PREVIEW_COUNT && (
          <Link href="/wishlists">
            <button className="text-xs font-semibold text-primary flex items-center gap-0.5">
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground">Loading wishlists...</p>
        </div>
      ) : wishlists.length === 0 ? (
        <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
          <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-sm">No wishlists yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Create a wishlist for your birthday, wedding, or any occasion and share it with friends!
          </p>
          <Link href="/wishlists">
            <Button size="sm" className="rounded-full mt-3 gap-1">
              <Plus className="w-3.5 h-3.5" /> Create First Wishlist
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {wishlists.slice(0, PREVIEW_COUNT).map((wishlist) => (
            <WishlistPreviewCard key={wishlist.id} wishlist={wishlist} />
          ))}
        </div>
      )}
    </div>
  );
    }

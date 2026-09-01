import { Link } from "wouter";
import type { Wishlist } from "@/hooks/use-wishlist";

interface WishlistPreviewCardProps {
  wishlist: Wishlist;
}

export default function WishlistPreviewCard({ wishlist }: WishlistPreviewCardProps) {
  const items = wishlist.items ?? [];
  const purchasedCount = items.filter((i) => i.is_purchased).length;
  const previewItems = items.slice(0, 3);

  return (
    <Link href="/wishlists">
      <div className="shrink-0 w-40 bg-card border border-card-border rounded-2xl p-3.5 space-y-2.5 hover:bg-muted/30 transition-colors cursor-pointer">
        <div className="flex items-center gap-1.5">
          <span className="text-lg leading-none" aria-hidden="true">{wishlist.emoji || "🎁"}</span>
          <p className="text-sm font-bold line-clamp-1 min-w-0">{wishlist.name}</p>
        </div>

        {previewItems.length > 0 ? (
          <div className="flex -space-x-2">
            {previewItems.map((item) => (
              <div key={item.id} className="w-9 h-9 rounded-full border-2 border-card bg-muted overflow-hidden shrink-0">
                {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-9 flex items-center">
            <p className="text-[11px] text-muted-foreground">No items yet</p>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""}
          {purchasedCount > 0 && ` · ${purchasedCount} purchased`}
        </p>
      </div>
    </Link>
  );
}

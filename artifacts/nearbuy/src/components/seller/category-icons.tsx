import { Shirt, Footprints, Smartphone, Sparkles, House, Gem, Dumbbell, Recycle, type LucideIcon } from "lucide-react";
import type { SellerCategoryId } from "@/lib/seller-categories";

const ICONS: Record<SellerCategoryId, LucideIcon> = {
  Fashion: Shirt,
  Shoes: Footprints,
  Electronics: Smartphone,
  "Beauty & Health": Sparkles,
  Home: House,
  "Jewelry & Accessories": Gem,
  "Gym & Outdoor": Dumbbell,
  Thrift: Recycle,
};

export default function SellerCategoryIcon({ id, className = "w-6 h-6" }: { id?: string; className?: string }) {
  const Icon = id ? ICONS[id as SellerCategoryId] : undefined;
  return Icon ? <Icon className={className} aria-hidden="true" /> : null;
}

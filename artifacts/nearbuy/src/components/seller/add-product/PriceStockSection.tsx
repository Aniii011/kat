import React from "react";
import { Input } from "@/components/ui/input";

// Duplicated from seller.tsx intentionally — seller.tsx's formatNaira is not
// exported, and seller.tsx is explicitly not being modified in this group.
// Flagging as a candidate to extract into a shared util once integration begins.
function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

const PLATFORM_MARKUP = 1.095;

interface PriceStockSectionProps {
  price: string;
  onPriceChange: (v: string) => void;
  stock: string;
  onStockChange: (v: string) => void;
  sku?: string;
  onSkuChange?: (v: string) => void;
  showSku?: boolean;
  stockPlaceholder?: string;
}

export default function PriceStockSection({
  price,
  onPriceChange,
  stock,
  onStockChange,
  sku,
  onSkuChange,
  showSku = true,
  stockPlaceholder = "Stock quantity *",
}: PriceStockSectionProps) {
  const numericPrice = Number(price);

  return (
    <div className="space-y-3">
      <div>
        <Input
          placeholder="Your price — what you want to earn (₦) *"
          type="number"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          className="rounded-xl h-11"
        />
        {price && numericPrice > 0 && (
          <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Buyers will pay</span>
            <span className="font-black text-primary">{formatNaira(numericPrice * PLATFORM_MARKUP)}</span>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          Includes KAT's 9.5% platform fee — you keep exactly what you type above.
        </p>
      </div>

      <Input
        placeholder={stockPlaceholder}
        type="number"
        value={stock}
        onChange={(e) => onStockChange(e.target.value)}
        className="rounded-xl h-11"
      />

      {showSku && onSkuChange && (
        <Input
          placeholder="SKU (optional)"
          value={sku || ""}
          onChange={(e) => onSkuChange(e.target.value)}
          className="rounded-xl h-11"
        />
      )}
    </div>
  );
}

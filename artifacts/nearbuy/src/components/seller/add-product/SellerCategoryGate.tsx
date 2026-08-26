import React from "react";
import { SELLER_CATEGORIES, type SellerCategoryId } from "@/lib/seller-categories";

interface SellerCategoryGateProps {
  onSelect: (category: SellerCategoryId) => void;
  saving?: boolean;
}

export default function SellerCategoryGate({ onSelect, saving = false }: SellerCategoryGateProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="max-w-sm w-full text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl">
          ✨
        </div>
        <h1 className="text-xl font-black mb-2">What do you sell?</h1>
        <p className="text-sm text-muted-foreground">
          We'll personalize your selling experience around this — the right
          fields, the right categories, every time you list something.
        </p>
      </div>

      <div className="max-w-sm w-full grid grid-cols-2 gap-3">
        {SELLER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            disabled={saving}
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border bg-card hover:border-primary transition-all disabled:opacity-50"
          >
            <span className="text-2xl">{cat.emoji}</span>
            <span className="text-xs font-bold text-center">{cat.label}</span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground mt-6">You can change this later in Settings.</p>
    </div>
  );
}

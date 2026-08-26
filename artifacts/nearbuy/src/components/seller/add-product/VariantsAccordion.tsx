import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ProductVariant } from "@/lib/product-variants";
import { COLORS, CLOTHING_SIZES, SHOE_SIZES } from "@/lib/product-option-sets";

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

interface VariantsAccordionProps {
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSizes?: string[];
  setSelectedSizes?: React.Dispatch<React.SetStateAction<string[]>>;
  selectedShoeSizes?: string[];
  setSelectedShoeSizes?: React.Dispatch<React.SetStateAction<string[]>>;
  showClothingSizes?: boolean;
  showShoeSizes?: boolean;
  useVariantPricing: boolean;
  setUseVariantPricing: (v: boolean) => void;
  variants: ProductVariant[];
  onGenerate: () => void;
  onUpdateVariant: (id: string, field: "price" | "stock", value: number | undefined) => void;
  defaultOpen?: boolean;
}

export default function VariantsAccordion({
  selectedColors,
  setSelectedColors,
  selectedSizes = [],
  setSelectedSizes,
  selectedShoeSizes = [],
  setSelectedShoeSizes,
  showClothingSizes = false,
  showShoeSizes = false,
  useVariantPricing,
  setUseVariantPricing,
  variants,
  onGenerate,
  onUpdateVariant,
  defaultOpen = false,
}: VariantsAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const hasAnySelection =
    selectedColors.length > 0 ||
    (showClothingSizes && selectedSizes.length > 0) ||
    (showShoeSizes && selectedShoeSizes.length > 0);

  const optionCount =
    Math.max(1, selectedColors.length) *
    Math.max(1, showClothingSizes ? selectedSizes.length : 1) *
    Math.max(1, showShoeSizes ? selectedShoeSizes.length : 1);

  return (
    <div className="bg-muted rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold"
      >
        <span>🎨 Add color/size options{variants.length > 0 ? ` (${variants.length})` : ""}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Colors</p>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColors((prev) => toggle(prev, c))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    selectedColors.includes(c)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {showClothingSizes && setSelectedSizes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Sizes</p>
              <div className="flex flex-wrap gap-1.5">
                {CLOTHING_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSizes((prev) => toggle(prev, s))}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      selectedSizes.includes(s)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showShoeSizes && setSelectedShoeSizes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Shoe Sizes</p>
              <div className="flex flex-wrap gap-1.5">
                {SHOE_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedShoeSizes((prev) => toggle(prev, s))}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      selectedShoeSizes.includes(s)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Different price per variant?</p>
            <button
              type="button"
              onClick={() => setUseVariantPricing(!useVariantPricing)}
              className={`w-10 h-6 rounded-full transition-colors ${useVariantPricing ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${useVariantPricing ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>

          {hasAnySelection && (
            <Button type="button" variant="outline" size="sm" className="w-full rounded-full text-xs" onClick={onGenerate}>
              Generate Variants ({optionCount})
            </Button>
          )}

          {variants.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {variants.map((v) => (
                <div key={v.id} className="bg-background rounded-xl p-2.5 space-y-2">
                  <p className="text-xs font-semibold">
                    {Object.values(v.attributes).filter(Boolean).join(" / ") || "Default"}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {useVariantPricing && (
                      <Input
                        placeholder="Price (₦)"
                        type="number"
                        value={v.price ?? ""}
                        onChange={(e) => onUpdateVariant(v.id, "price", e.target.value === "" ? undefined : Number(e.target.value))}
                        className="rounded-lg h-8 text-xs"
                      />
                    )}
                    <Input
                      placeholder="Stock qty"
                      type="number"
                      value={v.stock ?? ""}
                      onChange={(e) => onUpdateVariant(v.id, "stock", e.target.value === "" ? undefined : Number(e.target.value))}
                      className="rounded-lg h-8 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

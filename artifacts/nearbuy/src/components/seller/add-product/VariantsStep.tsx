import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ProductVariant } from "@/lib/product-variants";
import { COLORS, CLOTHING_SIZES, SHOE_SIZES } from "@/lib/product-option-sets";

interface Props {
  selectedColors: string[];
  selectedSizes: string[];
  selectedShoeSizes: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedShoeSizes: React.Dispatch<React.SetStateAction<string[]>>;
  useVariantPricing: boolean;
  setUseVariantPricing: (v: boolean) => void;
  variants: ProductVariant[];
  onGenerate: () => void;
  onUpdateVariant: (id: string, field: "price" | "stock" | "sku", value: number | string | undefined) => void;
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export default function VariantsStep({
  selectedColors, selectedSizes, selectedShoeSizes,
  setSelectedColors, setSelectedSizes, setSelectedShoeSizes,
  useVariantPricing, setUseVariantPricing,
  variants, onGenerate, onUpdateVariant,
}: Props) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Optional — skip if this product has no color/size variations.</p>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Colors</p>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setSelectedColors((prev) => toggle(prev, c))}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedColors.includes(c) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Clothing Sizes</p>
        <div className="flex flex-wrap gap-1.5">
          {CLOTHING_SIZES.map((s) => (
            <button key={s} type="button" onClick={() => setSelectedSizes((prev) => toggle(prev, s))}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedSizes.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Shoe Sizes</p>
        <div className="flex flex-wrap gap-1.5">
          {SHOE_SIZES.map((s) => (
            <button key={s} type="button" onClick={() => setSelectedShoeSizes((prev) => toggle(prev, s))}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedShoeSizes.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">Different price per variant?</p>
        <button type="button" onClick={() => setUseVariantPricing(!useVariantPricing)}
          className={`w-10 h-6 rounded-full transition-colors ${useVariantPricing ? "bg-primary" : "bg-muted-foreground/30"}`}>
          <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${useVariantPricing ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>

      {(selectedColors.length > 0 || selectedSizes.length > 0 || selectedShoeSizes.length > 0) && (
        <Button type="button" variant="outline" size="sm" className="w-full rounded-full text-xs" onClick={onGenerate}>
          Generate Variants ({Math.max(1, selectedColors.length) * Math.max(1, selectedSizes.length) * Math.max(1, selectedShoeSizes.length)})
        </Button>
      )}

      {variants.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {variants.map((v) => (
            <div key={v.id} className="bg-muted rounded-xl p-2.5 space-y-2">
              <p className="text-xs font-semibold">{Object.values(v.attributes).filter(Boolean).join(" / ") || "Default"}</p>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="SKU"
                  value={v.sku || ""}
                  onChange={(e) => onUpdateVariant(v.id, "sku", e.target.value === "" ? undefined : e.target.value)}
                  className="rounded-lg h-8 text-xs"
                />
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
  );
}

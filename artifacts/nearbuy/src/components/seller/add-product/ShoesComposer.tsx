import React from "react";
import { Input } from "@/components/ui/input";
import TagPicker from "./TagPicker";
import VariantsAccordion from "./VariantsAccordion";
import type { ProductVariant } from "@/lib/product-variants";
import { SHOES_MATERIAL_OPTIONS, SHOES_COLOR_OPTIONS } from "@/lib/product-attributes";

interface ShoesComposerProps {
  brand: string; onBrandChange: (v: string) => void;
  material: string; onMaterialChange: (v: string) => void;
  color: string; onColorChange: (v: string) => void;
  size: string; onSizeChange: (v: string) => void;

  selectedColors: string[]; setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedShoeSizes: string[]; setSelectedShoeSizes: React.Dispatch<React.SetStateAction<string[]>>;
  useVariantPricing: boolean; setUseVariantPricing: (v: boolean) => void;
  variants: ProductVariant[];
  onGenerateVariants: () => void;
  onUpdateVariant: (id: string, field: "price" | "stock", value: number | undefined) => void;
}

export default function ShoesComposer(props: ShoesComposerProps) {
  return (
    <div className="space-y-5">
      <Input placeholder="Brand (optional)" value={props.brand} onChange={(e) => props.onBrandChange(e.target.value)} className="rounded-xl h-11" />
      <TagPicker label="Material" options={SHOES_MATERIAL_OPTIONS} value={props.material} onChange={(v) => props.onMaterialChange(v as string)} />
      <TagPicker label="Color" options={SHOES_COLOR_OPTIONS} value={props.color} onChange={(v) => props.onColorChange(v as string)} />
      {/* NOTE: SHOES_SIZE_OPTIONS intentionally not rendered here as a standalone
          tag field — shoe size is captured via the Variants accordion below,
          matching how shoe sellers actually think about sizing (per-size stock),
          while still remaining fully optional/collapsed. */}

      <VariantsAccordion
        selectedColors={props.selectedColors}
        setSelectedColors={props.setSelectedColors}
        selectedShoeSizes={props.selectedShoeSizes}
        setSelectedShoeSizes={props.setSelectedShoeSizes}
        showShoeSizes
        useVariantPricing={props.useVariantPricing}
        setUseVariantPricing={props.setUseVariantPricing}
        variants={props.variants}
        onGenerateVariants={props.onGenerateVariants}
        onUpdateVariant={props.onUpdateVariant}
      />
    </div>
  );
}

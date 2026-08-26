import React from "react";
import TagPicker from "./TagPicker";
import VariantsAccordion from "./VariantsAccordion";
import type { ProductVariant } from "@/lib/product-variants";
import { JEWELRY_MATERIAL_OPTIONS, JEWELRY_COLOR_OPTIONS, JEWELRY_ADJUSTABLE_OPTIONS } from "@/lib/product-attributes";

interface JewelryComposerProps {
  material: string; onMaterialChange: (v: string) => void;
  color: string; onColorChange: (v: string) => void;
  adjustable: string; onAdjustableChange: (v: string) => void;

  selectedColors: string[]; setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  useVariantPricing: boolean; setUseVariantPricing: (v: boolean) => void;
  variants: ProductVariant[];
  onGenerateVariants: () => void;
  onUpdateVariant: (id: string, field: "price" | "stock", value: number | undefined) => void;
}

export default function JewelryComposer(props: JewelryComposerProps) {
  return (
    <div className="space-y-5">
      <TagPicker label="Material" options={JEWELRY_MATERIAL_OPTIONS} value={props.material} onChange={(v) => props.onMaterialChange(v as string)} />
      <TagPicker label="Color" options={JEWELRY_COLOR_OPTIONS} value={props.color} onChange={(v) => props.onColorChange(v as string)} />
      <TagPicker label="Adjustable" options={JEWELRY_ADJUSTABLE_OPTIONS} value={props.adjustable} onChange={(v) => props.onAdjustableChange(v as string)} />

      <VariantsAccordion
        selectedColors={props.selectedColors}
        setSelectedColors={props.setSelectedColors}
        useVariantPricing={props.useVariantPricing}
        setUseVariantPricing={props.setUseVariantPricing}
        variants={props.variants}
        onGenerate={props.onGenerateVariants}
        onUpdateVariant={props.onUpdateVariant}
      />
    </div>
  );
}

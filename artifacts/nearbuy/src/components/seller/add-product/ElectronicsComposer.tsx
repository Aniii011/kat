import React from "react";
import { Input } from "@/components/ui/input";
import TagPicker from "./TagPicker";
import VariantsAccordion from "./VariantsAccordion";
import type { ProductVariant } from "@/lib/product-variants";
import { ELECTRONICS_CONDITION_OPTIONS, ELECTRONICS_WARRANTY_OPTIONS } from "@/lib/product-attributes";

interface ElectronicsComposerProps {
  brand: string; onBrandChange: (v: string) => void;
  condition: string; onConditionChange: (v: string) => void;
  warranty: string; onWarrantyChange: (v: string) => void;

  selectedColors: string[]; setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  useVariantPricing: boolean; setUseVariantPricing: (v: boolean) => void;
  variants: ProductVariant[];
  onGenerateVariants: () => void;
  onUpdateVariant: (id: string, field: "price" | "stock", value: number | undefined) => void;
}

// No Storage, RAM, or Key Specs fields exist anywhere in this file.
export default function ElectronicsComposer(props: ElectronicsComposerProps) {
  return (
    <div className="space-y-5">
      <Input placeholder="Brand (optional)" value={props.brand} onChange={(e) => props.onBrandChange(e.target.value)} className="rounded-xl h-11" />
      <TagPicker label="Condition" options={ELECTRONICS_CONDITION_OPTIONS} value={props.condition} onChange={(v) => props.onConditionChange(v as string)} />
      <TagPicker label="Warranty" options={ELECTRONICS_WARRANTY_OPTIONS} value={props.warranty} onChange={(v) => props.onWarrantyChange(v as string)} />

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

import React from "react";
import { Input } from "@/components/ui/input";
import VariantsAccordion from "./VariantsAccordion";
import type { ProductVariant } from "@/lib/product-variants";
import { GYM_WEAR_SUBCATEGORY } from "@/lib/product-attributes";

interface GymComposerProps {
  subcategory: string; // gates whether Variants offers sizes at all
  material: string; onMaterialChange: (v: string) => void;

  selectedColors: string[]; setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSizes: string[]; setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  useVariantPricing: boolean; setUseVariantPricing: (v: boolean) => void;
  variants: ProductVariant[];
  onGenerateVariants: () => void;
  onUpdateVariant: (id: string, field: "price" | "stock", value: number | undefined) => void;
}

export default function GymComposer(props: GymComposerProps) {
  const isGymWear = props.subcategory === GYM_WEAR_SUBCATEGORY;
  return (
    <div className="space-y-5">
      <Input placeholder="Material (optional)" value={props.material} onChange={(e) => props.onMaterialChange(e.target.value)} className="rounded-xl h-11" />

      <VariantsAccordion
        selectedColors={props.selectedColors}
        setSelectedColors={props.setSelectedColors}
        selectedSizes={isGymWear ? props.selectedSizes : undefined}
        setSelectedSizes={isGymWear ? props.setSelectedSizes : undefined}
        showClothingSizes={isGymWear}
        useVariantPricing={props.useVariantPricing}
        setUseVariantPricing={props.setUseVariantPricing}
        variants={props.variants}
        onGenerate={props.onGenerateVariants}
        onUpdateVariant={props.onUpdateVariant}
      />
    </div>
  );
}

import React from "react";
import { Input } from "@/components/ui/input";
import TagPicker from "./TagPicker";
import VariantsAccordion from "./VariantsAccordion";
import type { ProductVariant } from "@/lib/product-variants";
import { HOME_POWER_SOURCE_OPTIONS, HOME_APPLIANCES_SUBCATEGORY } from "@/lib/product-attributes";

interface HomeComposerProps {
  subcategory: string; // used only to gate Power Source visibility
  material: string; onMaterialChange: (v: string) => void;
  powerSource: string; onPowerSourceChange: (v: string) => void;

  selectedColors: string[]; setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  useVariantPricing: boolean; setUseVariantPricing: (v: boolean) => void;
  variants: ProductVariant[];
  onGenerateVariants: () => void;
  onUpdateVariant: (id: string, field: "price" | "stock", value: number | undefined) => void;
}

// Dimensions is NOT rendered here — belongs only inside MoreOptionsAccordion.
export default function HomeComposer(props: HomeComposerProps) {
  const showPowerSource = props.subcategory === HOME_APPLIANCES_SUBCATEGORY;
  return (
    <div className="space-y-5">
      <Input placeholder="Material (optional)" value={props.material} onChange={(e) => props.onMaterialChange(e.target.value)} className="rounded-xl h-11" />
      {showPowerSource && (
        <TagPicker label="Power Source" options={HOME_POWER_SOURCE_OPTIONS} value={props.powerSource} onChange={(v) => props.onPowerSourceChange(v as string)} />
      )}

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

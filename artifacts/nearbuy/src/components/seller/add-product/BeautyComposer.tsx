import React from "react";
import { Input } from "@/components/ui/input";
import VariantsAccordion from "./VariantsAccordion";
import type { ProductVariant } from "@/lib/product-variants";

interface BeautyComposerProps {
  shadeType: string; onShadeTypeChange: (v: string) => void;
  volumeSize: string; onVolumeSizeChange: (v: string) => void;

  selectedColors: string[]; setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  useVariantPricing: boolean; setUseVariantPricing: (v: boolean) => void;
  variants: ProductVariant[];
  onGenerateVariants: () => void;
  onUpdateVariant: (id: string, field: "price" | "stock", value: number | undefined) => void;
}

// Expiry Date is NOT rendered here — it belongs only inside MoreOptionsAccordion,
// wired up by whichever parent assembles this composer (Group 3).
export default function BeautyComposer(props: BeautyComposerProps) {
  return (
    <div className="space-y-5">
      <Input placeholder="Shade / Type (optional)" value={props.shadeType} onChange={(e) => props.onShadeTypeChange(e.target.value)} className="rounded-xl h-11" />
      <Input placeholder="Volume / Size (optional, e.g. 30ml)" value={props.volumeSize} onChange={(e) => props.onVolumeSizeChange(e.target.value)} className="rounded-xl h-11" />

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

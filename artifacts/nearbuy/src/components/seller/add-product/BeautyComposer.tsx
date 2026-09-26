import React from "react";
import { Input } from "@/components/ui/input";
import VariantsAccordion from "./VariantsAccordion";
import type { ProductVariant } from "@/lib/product-variants";

interface BeautyComposerProps {
  shadeType: string; onShadeTypeChange: (v: string) => void;
  volumeSize: string; onVolumeSizeChange: (v: string) => void;

  selectedColors: string[]; setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  colorImages?: Record<string, string>; setColorImages?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  uploadSingleImage?: (file: File) => Promise<{ url: string | null; error: string | null }>;
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
        axisLabel="Length / Shade / Type"
        colorImages={props.colorImages}
        onColorImagesChange={props.setColorImages}
        onUploadImage={props.uploadSingleImage}
        useVariantPricing={props.useVariantPricing}
        setUseVariantPricing={props.setUseVariantPricing}
        variants={props.variants}
        onGenerate={props.onGenerateVariants}
        onUpdateVariant={props.onUpdateVariant}
      />
    </div>
  );
}

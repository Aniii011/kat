import React from "react";
import TagPicker from "./TagPicker";
import VariantsAccordion from "./VariantsAccordion";
import type { ProductVariant } from "@/lib/product-variants";
import { AESTHETICS } from "@/data/listings";
import {
  FASHION_FIT_OPTIONS, FASHION_MATERIAL_OPTIONS, FASHION_OCCASION_OPTIONS,
  FASHION_AUDIENCE_OPTIONS, FASHION_COLOR_OPTIONS, FASHION_SIZE_OPTIONS,
} from "@/lib/product-attributes";

interface FashionComposerProps {
  color: string; onColorChange: (v: string) => void;
  size: string; onSizeChange: (v: string) => void;
  fit: string; onFitChange: (v: string) => void;
  material: string; onMaterialChange: (v: string) => void;
  occasion: string; onOccasionChange: (v: string) => void;
  audience: string; onAudienceChange: (v: string) => void;
  aesthetics: string[]; onAestheticsChange: (v: string[]) => void;

  selectedColors: string[]; setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSizes: string[]; setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  useVariantPricing: boolean; setUseVariantPricing: (v: boolean) => void;
  variants: ProductVariant[];
  onGenerateVariants: () => void;
  onUpdateVariant: (id: string, field: "price" | "stock", value: number | undefined) => void;
}

export default function FashionComposer(props: FashionComposerProps) {
  return (
    <div className="space-y-5">
      <TagPicker label="Color" options={FASHION_COLOR_OPTIONS} value={props.color} onChange={(v) => props.onColorChange(v as string)} />
      <TagPicker label="Size" options={FASHION_SIZE_OPTIONS} value={props.size} onChange={(v) => props.onSizeChange(v as string)} />
      <TagPicker label="Fit" options={FASHION_FIT_OPTIONS} value={props.fit} onChange={(v) => props.onFitChange(v as string)} />
      <TagPicker label="Material" options={FASHION_MATERIAL_OPTIONS} value={props.material} onChange={(v) => props.onMaterialChange(v as string)} />
      <TagPicker label="Occasion" options={FASHION_OCCASION_OPTIONS} value={props.occasion} onChange={(v) => props.onOccasionChange(v as string)} />
      <TagPicker label="Audience" options={FASHION_AUDIENCE_OPTIONS} value={props.audience} onChange={(v) => props.onAudienceChange(v as string)} />
      <TagPicker
        label="Vibes / Aesthetics"
        options={AESTHETICS.map((a) => a.label)}
        value={props.aesthetics}
        onChange={(v) => props.onAestheticsChange(v as string[])}
        multi
      />

      <VariantsAccordion
        selectedColors={props.selectedColors}
        setSelectedColors={props.setSelectedColors}
        selectedSizes={props.selectedSizes}
        setSelectedSizes={props.setSelectedSizes}
        showClothingSizes
        useVariantPricing={props.useVariantPricing}
        setUseVariantPricing={props.setUseVariantPricing}
        variants={props.variants}
        onGenerate={props.onGenerateVariants}
        onUpdateVariant={props.onUpdateVariant}
      />
    </div>
  );
        }

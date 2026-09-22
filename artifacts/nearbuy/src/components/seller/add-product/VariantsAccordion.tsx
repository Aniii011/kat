import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ProductVariant } from "@/lib/product-variants";
import { COLORS, CLOTHING_SIZES, SHOE_SIZES } from "@/lib/product-option-sets";
import { Plus, X } from "lucide-react";

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

interface VariantsAccordionProps {
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  // Optional: lets the seller attach one reference photo per color, so
  // buyers can visually tell variants apart (e.g. yellow vs maroon dress)
  // instead of relying on the color name alone. Only rendered when both
  // are provided by the parent composer.
  colorImages?: Record<string, string>;
  onColorImagesChange?: (next: Record<string, string>) => void;
  onUploadImage?: (file: File) => Promise<{ url: string | null; error: string | null }>;
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
  colorImages,
  onColorImagesChange,
  onUploadImage,
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
  const [addingCustomColor, setAddingCustomColor] = useState(false);
  const [customColorInput, setCustomColorInput] = useState("");
  const [addingCustomSize, setAddingCustomSize] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [addingCustomShoeSize, setAddingCustomShoeSize] = useState(false);
  const [customShoeSizeInput, setCustomShoeSizeInput] = useState("");
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [colorPhotoError, setColorPhotoError] = useState<string | null>(null);

  const commitCustomColor = () => {
    const trimmed = customColorInput.trim();
    if (trimmed && !selectedColors.includes(trimmed)) {
      setSelectedColors((prev) => [...prev, trimmed]);
    }
    setCustomColorInput("");
    setAddingCustomColor(false);
  };

  const commitCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (trimmed && setSelectedSizes && !selectedSizes.includes(trimmed)) {
      setSelectedSizes((prev) => [...prev, trimmed]);
    }
    setCustomSizeInput("");
    setAddingCustomSize(false);
  };

  const commitCustomShoeSize = () => {
    const trimmed = customShoeSizeInput.trim();
    if (trimmed && setSelectedShoeSizes && !selectedShoeSizes.includes(trimmed)) {
      setSelectedShoeSizes((prev) => [...prev, trimmed]);
    }
    setCustomShoeSizeInput("");
    setAddingCustomShoeSize(false);
  };

  const handleColorPhotoSelect = async (color: string, file: File | undefined) => {
    if (!file || !onUploadImage || !onColorImagesChange) return;
    setUploadingColor(color);
    setColorPhotoError(null);
    const { url, error } = await onUploadImage(file);
    setUploadingColor(null);
    if (url) {
      onColorImagesChange({ ...(colorImages || {}), [color]: url });
    } else {
      setColorPhotoError(error || "Upload failed — please try again.");
    }
  };

  const removeColorPhoto = (color: string) => {
    if (!onColorImagesChange || !colorImages) return;
    const next = { ...colorImages };
    delete next[color];
    onColorImagesChange(next);
  };

  // A previously-added custom color won't be in the preset COLORS list —
  // still needs to render as a removable chip.
  const customSelectedColors = selectedColors.filter((c) => !COLORS.includes(c));

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

              {customSelectedColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColors((prev) => toggle(prev, c))}
                  className="text-xs pl-2.5 pr-1.5 py-1 rounded-full border border-primary bg-primary text-primary-foreground font-medium flex items-center gap-1"
                >
                  {c}
                  <X className="w-3 h-3" />
                </button>
              ))}

              {!addingCustomColor && (
                <button
                  type="button"
                  onClick={() => setAddingCustomColor(true)}
                  className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Custom
                </button>
              )}

              {addingCustomColor && (
                <input
                  autoFocus
                  type="text"
                  value={customColorInput}
                  onChange={(e) => setCustomColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); commitCustomColor(); }
                    if (e.key === "Escape") { setAddingCustomColor(false); setCustomColorInput(""); }
                  }}
                  onBlur={commitCustomColor}
                  placeholder="e.g. Olive Green"
                  className="text-xs px-2.5 py-1 rounded-full border border-primary bg-background outline-none w-28"
                />
              )}
            </div>
          </div>

          {/* Reference photo per color — helps buyers tell variants apart
              at a glance (e.g. yellow vs maroon), and shows on the product
              page as tappable color swatches with a real thumbnail. Only
              rendered when the parent composer supports it. */}
          {selectedColors.length > 0 && onUploadImage && onColorImagesChange && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Photo per design (optional)</p>
              <div className="flex flex-wrap gap-2">
                {selectedColors.map((c) => (
                  <label key={c} className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-14 h-14 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center relative">
                      {uploadingColor === c ? (
                        <span className="text-[9px] text-muted-foreground">Uploading...</span>
                      ) : colorImages?.[c] ? (
                        <>
                          <img src={colorImages[c]} alt={c} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); removeColorPhoto(c); }}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-background/90 flex items-center justify-center"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </>
                      ) : (
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground max-w-[56px] truncate">{c}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleColorPhotoSelect(c, e.target.files?.[0])}
                    />
                  </label>
                ))}
              </div>
              {colorPhotoError && (
                <p className="text-xs text-destructive mt-2">{colorPhotoError}</p>
              )}
            </div>
          )}

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
                {selectedSizes.filter((s) => !CLOTHING_SIZES.includes(s)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSizes((prev) => toggle(prev, s))}
                    className="text-xs pl-2.5 pr-1.5 py-1 rounded-full border border-primary bg-primary text-primary-foreground font-medium flex items-center gap-1"
                  >
                    {s}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                {!addingCustomSize && (
                  <button
                    type="button"
                    onClick={() => setAddingCustomSize(true)}
                    className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Custom
                  </button>
                )}
                {addingCustomSize && (
                  <input
                    autoFocus
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); commitCustomSize(); }
                      if (e.key === "Escape") { setAddingCustomSize(false); setCustomSizeInput(""); }
                    }}
                    onBlur={commitCustomSize}
                    placeholder="e.g. 01"
                    className="text-xs px-2.5 py-1 rounded-full border border-primary bg-background outline-none w-20"
                  />
                )}
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
                {selectedShoeSizes.filter((s) => !SHOE_SIZES.includes(s)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedShoeSizes((prev) => toggle(prev, s))}
                    className="text-xs pl-2.5 pr-1.5 py-1 rounded-full border border-primary bg-primary text-primary-foreground font-medium flex items-center gap-1"
                  >
                    {s}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                {!addingCustomShoeSize && (
                  <button
                    type="button"
                    onClick={() => setAddingCustomShoeSize(true)}
                    className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Custom
                  </button>
                )}
                {addingCustomShoeSize && (
                  <input
                    autoFocus
                    type="text"
                    value={customShoeSizeInput}
                    onChange={(e) => setCustomShoeSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); commitCustomShoeSize(); }
                      if (e.key === "Escape") { setAddingCustomShoeSize(false); setCustomShoeSizeInput(""); }
                    }}
                    onBlur={commitCustomShoeSize}
                    placeholder="e.g. 42.5"
                    className="text-xs px-2.5 py-1 rounded-full border border-primary bg-background outline-none w-20"
                  />
                )}
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

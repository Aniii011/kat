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
  // Lets a composer rename this axis — e.g. "Length / Shade / Type" for
  // wigs, instead of the default "Colour / Design", which doesn't fit
  // every product category (Beauty & Health has no real "color" concept).
  axisLabel?: string;
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
  axisLabel = "Colour / Design",
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
    // Splitting on commas lets a seller add many values in one go —
    // e.g. "10 inch, 12 inch, 14 inch" for a wig with 8 lengths, instead
    // of repeating the add-one-at-a-time flow eight separate times.
    const values = customColorInput
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0 && !selectedColors.includes(v));
    if (values.length > 0) {
      setSelectedColors((prev) => [...prev, ...values]);
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

  // Note: selectedColors may include values not in the COLORS preset list
  // (custom-typed ones) — the grid below renders all of selectedColors
  // directly, so no separate filtering is needed here.

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
            <p className="text-xs font-semibold text-muted-foreground mb-2">{axisLabel}</p>
            <div className="flex flex-wrap gap-1.5 mb-1">
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

              {!addingCustomColor && (
                <button
                  type="button"
                  onClick={() => setAddingCustomColor(true)}
                  className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add {axisLabel.split(" / ")[0].toLowerCase()}
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
                  placeholder="e.g. 10 inch, 12 inch, 14 inch"
                  className="text-xs px-2.5 py-1 rounded-full border border-primary bg-background outline-none w-56"
                />
              )}
            </div>
            {addingCustomColor && (
              <p className="text-[10px] text-muted-foreground mb-2">
                Adding several? Separate with commas — e.g. "10 inch, 12 inch, 14 inch" adds all three at once.
              </p>
            )}

            {/* Each variant is a photo tile with its name as a caption
                directly underneath, matching how SHEIN/Temu show color
                and print variants — the photo IS the variant, not a
                separate thing you have to cross-reference. */}
            {selectedColors.length > 0 && (
              <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                {selectedColors.map((c) => (
                  <div key={c} className="relative">
                    <label className="block cursor-pointer">
                      <div className="aspect-square rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center relative">
                        {uploadingColor === c ? (
                          <span className="text-[10px] text-muted-foreground text-center px-2">Uploading...</span>
                        ) : colorImages?.[c] ? (
                          <img src={colorImages[c]} alt={c} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <Plus className="w-5 h-5" />
                            <span className="text-[9px]">Add photo</span>
                          </div>
                        )}
                      </div>
                      {onUploadImage && onColorImagesChange && (
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleColorPhotoSelect(c, e.target.files?.[0])}
                        />
                      )}
                    </label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] font-medium truncate">{c}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedColors((prev) => toggle(prev, c))}
                        className="shrink-0 text-muted-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {colorImages?.[c] && onColorImagesChange && (
                      <button
                        type="button"
                        onClick={() => removeColorPhoto(c)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/90 flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {colorPhotoError && (
              <p className="text-xs text-destructive mt-2">{colorPhotoError}</p>
            )}
          </div>

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

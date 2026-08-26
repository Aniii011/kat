import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PACKAGE_SIZES = [
  { value: "small", label: "Small", desc: "0–5kg · 60×40×20cm", example: "Phones, shirts, books" },
  { value: "medium", label: "Medium", desc: "5–15kg · 80×60×40cm", example: "Shoes, laptops, blenders" },
  { value: "large", label: "Large", desc: "15–35kg · 140×80×60cm", example: "Microwaves, bulk items" },
];

interface MoreOptionsAccordionProps {
  sellerNote: string;
  onSellerNoteChange: (v: string) => void;
  sellerNotePlaceholder?: string;

  showPackageSize?: boolean;
  packageSize?: string;
  onPackageSizeChange?: (v: string) => void;

  showExpiryDate?: boolean;
  expiryDate?: string;
  onExpiryDateChange?: (v: string) => void;

  showDimensions?: boolean;
  dimensions?: string;
  onDimensionsChange?: (v: string) => void;

  defaultOpen?: boolean;
}

export default function MoreOptionsAccordion({
  sellerNote,
  onSellerNoteChange,
  sellerNotePlaceholder = 'Only visible to you. e.g. "Stored in box 3"',
  showPackageSize = false,
  packageSize,
  onPackageSizeChange,
  showExpiryDate = false,
  expiryDate,
  onExpiryDateChange,
  showDimensions = false,
  dimensions,
  onDimensionsChange,
  defaultOpen = false,
}: MoreOptionsAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-muted rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold"
      >
        <span>More options</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {showPackageSize && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Package Size</p>
              <div className="space-y-2">
                {PACKAGE_SIZES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => onPackageSizeChange?.(p.value)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      packageSize === p.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{p.example}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showExpiryDate && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Expiry Date</p>
              <Input
                type="date"
                value={expiryDate || ""}
                onChange={(e) => onExpiryDateChange?.(e.target.value)}
                className="rounded-xl h-11 bg-background"
              />
            </div>
          )}

          {showDimensions && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Dimensions (optional)</p>
              <Input
                placeholder='e.g. "120cm x 60cm x 75cm"'
                value={dimensions || ""}
                onChange={(e) => onDimensionsChange?.(e.target.value)}
                className="rounded-xl h-11 bg-background"
              />
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              🔒 Private Seller Note
            </p>
            <Textarea
              placeholder={sellerNotePlaceholder}
              value={sellerNote}
              onChange={(e) => onSellerNoteChange(e.target.value)}
              className="rounded-xl resize-none text-xs bg-background"
              rows={2}
            />
            <p className="text-[10px] text-muted-foreground">Buyers cannot see this note.</p>
          </div>
        </div>
      )}
    </div>
  );
}

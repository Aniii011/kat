import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { SUBCATEGORIES, type TopCategory } from "@/data/listings";
import { SELLER_CATEGORY_TO_TOP_CATEGORIES, THRIFT_ITEM_TYPES, type SellerCategoryId } from "@/lib/seller-categories";

const FASHION_DEPARTMENTS: { value: TopCategory; label: string }[] = [
  { value: "Woman", label: "Women's" },
  { value: "Men", label: "Men's" },
  { value: "Kids", label: "Kids" },
];

interface SubcategoryPickerProps {
  sellerCategory: SellerCategoryId;
  department: string;
  onDepartmentChange: (v: string) => void;
  subcategory: string;
  onSubcategoryChange: (v: string) => void;
}

/**
 * A "what are you listing?" chip list that also lets the seller type
 * something not in the preset list (e.g. "Bracelet" when it's missing
 * from the Jewelry & Accessories subcategory set). Kept local to this
 * file since the custom-entry UI needs the current label as a chip too,
 * same interaction pattern as TagPicker's allowCustom.
 */
function CustomizableChips({
  presetOptions,
  value,
  onChange,
}: {
  presetOptions: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const isCustomSelected = value && !presetOptions.includes(value);

  const commitCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed) onChange(trimmed);
    setCustomInput("");
    setAddingCustom(false);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {presetOptions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
            value === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
          }`}
        >
          {s}
        </button>
      ))}

      {isCustomSelected && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs pl-3 pr-2 py-1.5 rounded-full border-2 border-primary bg-primary text-primary-foreground font-medium flex items-center gap-1"
        >
          {value}
          <X className="w-3 h-3" />
        </button>
      )}

      {!addingCustom && (
        <button
          type="button"
          onClick={() => setAddingCustom(true)}
          className="text-xs px-3 py-1.5 rounded-full border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Custom
        </button>
      )}

      {addingCustom && (
        <input
          autoFocus
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commitCustom(); }
            if (e.key === "Escape") { setAddingCustom(false); setCustomInput(""); }
          }}
          onBlur={commitCustom}
          placeholder="e.g. Bracelet"
          className="text-xs px-3 py-1.5 rounded-full border-2 border-primary bg-background outline-none w-32"
        />
      )}
    </div>
  );
}

export default function SubcategoryPicker({
  sellerCategory,
  department,
  onDepartmentChange,
  subcategory,
  onSubcategoryChange,
}: SubcategoryPickerProps) {
  if (sellerCategory === "Thrift") {
    return (
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Item Type *</p>
        <CustomizableChips presetOptions={THRIFT_ITEM_TYPES} value={subcategory} onChange={onSubcategoryChange} />
      </div>
    );
  }

  if (sellerCategory === "Fashion") {
    const subOptions = department ? SUBCATEGORIES[department as TopCategory] || [] : [];
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Department *</p>
          <div className="flex flex-wrap gap-1.5">
            {FASHION_DEPARTMENTS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => {
                  onDepartmentChange(d.value);
                  onSubcategoryChange("");
                }}
                className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
                  department === d.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        {department && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">What are you listing? *</p>
            <CustomizableChips presetOptions={subOptions} value={subcategory} onChange={onSubcategoryChange} />
          </div>
        )}
      </div>
    );
  }

  // Shoes / Electronics / Beauty & Health / Home / Jewelry & Accessories / Gym & Outdoor —
  // each maps to exactly one existing TOP_CATEGORIES value; show its SUBCATEGORIES directly.
  const topCategories = SELLER_CATEGORY_TO_TOP_CATEGORIES[sellerCategory];
  const topCategory = topCategories[0] as TopCategory | undefined;
  const subOptions = topCategory ? SUBCATEGORIES[topCategory] || [] : [];

  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">What are you listing? *</p>
      <CustomizableChips presetOptions={subOptions} value={subcategory} onChange={onSubcategoryChange} />
    </div>
  );
          }

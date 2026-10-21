import React, { useEffect, useState } from "react";
import { Plus, X, Sparkles } from "lucide-react";
import { SUBCATEGORIES, type TopCategory } from "@/data/listings";
import { SELLER_CATEGORY_TO_TOP_CATEGORIES, THRIFT_ITEM_TYPES, type SellerCategoryId } from "@/lib/seller-categories";
import {
  MAX_SUBCATEGORIES_PER_PRODUCT,
  fetchPopularCustomSubcategories,
  normalizeSubcategory,
  subKey,
} from "@/lib/subcategories";

const FASHION_DEPARTMENTS: { value: TopCategory; label: string }[] = [
  { value: "Woman", label: "Women's" },
  { value: "Men", label: "Men's" },
  { value: "Kids", label: "Kids" },
];

interface SubcategoryPickerProps {
  sellerCategory: SellerCategoryId;
  department: string;
  onDepartmentChange: (v: string) => void;
  subcategories: string[];
  onSubcategoriesChange: (v: string[]) => void;
}

const chipBase = "text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all";
const chipOn = "bg-primary text-primary-foreground border-primary";
const chipOff = "border-border hover:border-primary/50";

/**
 * "What are you listing?" — pick up to MAX options (an item can be both
 * "Polo Shirts" and "Shirts"). Sellers can also type their own; custom ones
 * that many sellers use show up here as ready-made suggestions.
 * The first one picked is the product's main subcategory.
 */
function MultiChips({
  presetOptions,
  suggestionTops,
  value,
  onChange,
}: {
  presetOptions: readonly string[];
  suggestionTops: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const topsKey = suggestionTops.join("|");
  useEffect(() => {
    let cancelled = false;
    if (suggestionTops.length === 0) { setSuggestions([]); return; }
    fetchPopularCustomSubcategories(suggestionTops).then((s) => { if (!cancelled) setSuggestions(s); });
    return () => { cancelled = true; };
  }, [topsKey]);

  const atMax = value.length >= MAX_SUBCATEGORIES_PER_PRODUCT;
  const isSelected = (label: string) => value.some((v) => subKey(v) === subKey(label));

  const toggle = (label: string) => {
    if (isSelected(label)) onChange(value.filter((v) => subKey(v) !== subKey(label)));
    else if (!atMax) onChange([...value, label]);
  };

  const commitCustom = () => {
    const normalized = normalizeSubcategory(customInput, [...presetOptions, ...suggestions, ...value]);
    if (normalized && !isSelected(normalized) && !atMax) onChange([...value, normalized]);
    setCustomInput("");
    setAddingCustom(false);
  };

  const shownSuggestions = suggestions.filter(
    (s) => !presetOptions.some((p) => subKey(p) === subKey(s))
  );
  // Selected options that aren't a preset or a suggestion (typed by this seller).
  const ownCustom = value.filter(
    (v) =>
      !presetOptions.some((p) => subKey(p) === subKey(v)) &&
      !shownSuggestions.some((s) => subKey(s) === subKey(v))
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {presetOptions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            disabled={!isSelected(s) && atMax}
            className={`${chipBase} ${isSelected(s) ? chipOn : chipOff} disabled:opacity-40`}
          >
            {s}
          </button>
        ))}

        {shownSuggestions.map((s) => (
          <button
            key={`sug-${s}`}
            type="button"
            onClick={() => toggle(s)}
            disabled={!isSelected(s) && atMax}
            className={`${chipBase} ${isSelected(s) ? chipOn : "border-dashed border-primary/40 hover:border-primary"} flex items-center gap-1 disabled:opacity-40`}
          >
            <Sparkles className="w-3 h-3" /> {s}
          </button>
        ))}

        {ownCustom.map((s) => (
          <button
            key={`own-${s}`}
            type="button"
            onClick={() => toggle(s)}
            className={`${chipBase} ${chipOn} pl-3 pr-2 flex items-center gap-1`}
          >
            {s}
            <X className="w-3 h-3" />
          </button>
        ))}

        {!addingCustom && !atMax && (
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
            maxLength={30}
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

      <p className="text-[11px] text-muted-foreground">
        {value.length === 0
          ? `Pick up to ${MAX_SUBCATEGORIES_PER_PRODUCT}. An item can fit more than one (e.g. Polo Shirts and Shirts).`
          : `${value.length}/${MAX_SUBCATEGORIES_PER_PRODUCT} selected · main: ${value[0]}`}
      </p>
    </div>
  );
}

export default function SubcategoryPicker({
  sellerCategory,
  department,
  onDepartmentChange,
  subcategories,
  onSubcategoriesChange,
}: SubcategoryPickerProps) {
  if (sellerCategory === "Thrift") {
    return (
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Item Type *</p>
        <MultiChips presetOptions={THRIFT_ITEM_TYPES} suggestionTops={["Thrift"]} value={subcategories} onChange={onSubcategoriesChange} />
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
                  onSubcategoriesChange([]);
                }}
                className={`${chipBase} ${department === d.value ? chipOn : chipOff}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        {department && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">What are you listing? *</p>
            <MultiChips presetOptions={subOptions} suggestionTops={[department]} value={subcategories} onChange={onSubcategoriesChange} />
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
      <MultiChips presetOptions={subOptions} suggestionTops={topCategories} value={subcategories} onChange={onSubcategoriesChange} />
    </div>
  );
}

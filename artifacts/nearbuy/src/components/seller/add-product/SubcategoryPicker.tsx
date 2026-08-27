import React from "react";
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
        <div className="flex flex-wrap gap-1.5">
          {THRIFT_ITEM_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSubcategoryChange(t)}
              className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
                subcategory === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
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
        {department && subOptions.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">What are you listing? *</p>
            <div className="flex flex-wrap gap-1.5">
              {subOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSubcategoryChange(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
                    subcategory === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
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
      <div className="flex flex-wrap gap-1.5">
        {subOptions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSubcategoryChange(s)}
            className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
              subcategory === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

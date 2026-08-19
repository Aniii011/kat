import React from "react";
import { TOP_CATEGORIES, SUBCATEGORIES, type TopCategory } from "@/data/listings";

interface Props {
  category: string;
  subcategory: string;
  isEditing: boolean;
  onSelect: (category: string, subcategory: string) => void;
}

export default function CategoryStep({ category, subcategory, isEditing, onSelect }: Props) {
  const selectedTop = (TOP_CATEGORIES as readonly string[]).includes(category) ? (category as TopCategory) : null;
  const subOptions = selectedTop ? SUBCATEGORIES[selectedTop] : [];
  const isLegacyValue = isEditing && category && !(TOP_CATEGORIES as readonly string[]).includes(category);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold mb-1">What are you selling?</p>
        <p className="text-xs text-muted-foreground mb-3">Choose the category that best fits your product.</p>
        <div className="grid grid-cols-2 gap-2">
          {TOP_CATEGORIES.filter((c) => c !== "Deals").map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelect(cat, "")}
              className={`text-sm px-3 py-3 rounded-xl border-2 font-semibold text-left transition-all ${
                category === cat ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {selectedTop && subOptions.length > 0 && (
        <div>
          <p className="text-sm font-bold mb-2">Subcategory</p>
          <div className="flex flex-wrap gap-2">
            {subOptions.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => onSelect(category, sub)}
                className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
                  subcategory === sub ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLegacyValue && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
          This product's current category is <strong>{category}</strong>, an older value not in the list above. It will stay as-is unless you pick a new category here.
        </div>
      )}
    </div>
  );
}

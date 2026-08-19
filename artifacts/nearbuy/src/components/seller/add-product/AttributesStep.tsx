import React from "react";
import { getAttributeFieldsForSubcategory } from "@/lib/product-attributes";

interface Props {
  subcategory: string;
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}

export default function AttributesStep({ subcategory, values, onChange }: Props) {
  const fields = getAttributeFieldsForSubcategory(subcategory);

  if (fields.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        No extra details needed for this subcategory — tap Continue to skip ahead.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div key={field.id}>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
            {field.label}{field.required && " *"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(field.options || []).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(field.id, values[field.id] === opt ? "" : opt)}
                className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
                  values[field.id] === opt ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

import React from "react";
import { Check } from "lucide-react";

export const ADD_PRODUCT_STEPS = ["Category", "Details", "Attributes", "Images", "Variants", "Pricing", "Review"] as const;

export default function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-1 pb-1">
      {ADD_PRODUCT_STEPS.map((label, i) => (
        <div key={label} className="flex items-center shrink-0">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                ? "bg-primary/15 text-primary border-2 border-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i < current ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          <span className={`text-[10px] ml-1 mr-2 whitespace-nowrap ${i === current ? "font-bold text-foreground" : "text-muted-foreground"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

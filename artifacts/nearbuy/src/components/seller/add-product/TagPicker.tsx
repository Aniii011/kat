import React from "react";

export interface TagPickerProps {
  label: string;
  options: string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multi?: boolean;
  required?: boolean;
  helperText?: string;
  // Reserved for future "recently used" support — intentionally unused today.
  // Accepting this prop now means TagPicker's public shape won't need to
  // change later when recent-values support is added. Not implemented yet.
  recentValues?: string[];
}

export default function TagPicker({
  label,
  options,
  value,
  onChange,
  multi = false,
  required = false,
  helperText,
}: TagPickerProps) {
  const selected: string[] = multi
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === "string" && value
    ? [value]
    : [];

  const toggle = (opt: string) => {
    if (multi) {
      const current = Array.isArray(value) ? value : [];
      onChange(current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt]);
    } else {
      onChange(value === opt ? "" : opt);
    }
  };

  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
        {label}
        {required && " *"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
              selected.includes(opt)
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {helperText && <p className="text-[10px] text-muted-foreground mt-1">{helperText}</p>}
    </div>
  );
}

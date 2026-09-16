import React, { useState } from "react";
import { Plus, X } from "lucide-react";

export interface TagPickerProps {
  label: string;
  options: string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multi?: boolean;
  required?: boolean;
  helperText?: string;
  // When true, shows a "+ Custom" chip that lets the seller type a value
  // not in `options` (e.g. "Olive Green", "Burgundy"). Off by default so
  // pickers that intentionally want a closed set (e.g. condition) are
  // unaffected.
  allowCustom?: boolean;
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
  allowCustom = false,
}: TagPickerProps) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

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

  const commitCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) {
      setAddingCustom(false);
      return;
    }
    if (multi) {
      const current = Array.isArray(value) ? value : [];
      if (!current.includes(trimmed)) onChange([...current, trimmed]);
    } else {
      onChange(trimmed);
    }
    setCustomInput("");
    setAddingCustom(false);
  };

  // A selected value that isn't in the preset list (a previously-entered
  // custom value) still needs to render as a removable chip.
  const customSelectedValues = selected.filter((v) => !options.includes(v));

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

        {customSelectedValues.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="text-xs pl-3 pr-2 py-1.5 rounded-full border-2 border-primary bg-primary text-primary-foreground font-medium flex items-center gap-1"
          >
            {opt}
            <X className="w-3 h-3" />
          </button>
        ))}

        {allowCustom && !addingCustom && (
          <button
            type="button"
            onClick={() => setAddingCustom(true)}
            className="text-xs px-3 py-1.5 rounded-full border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Custom
          </button>
        )}

        {allowCustom && addingCustom && (
          <span className="inline-flex items-center gap-1">
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
              placeholder={`e.g. Olive Green`}
              className="text-xs px-3 py-1.5 rounded-full border-2 border-primary bg-background outline-none w-32"
            />
          </span>
        )}
      </div>
      {helperText && <p className="text-[10px] text-muted-foreground mt-1">{helperText}</p>}
    </div>
  );
}

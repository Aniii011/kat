import React from "react";
import { Input } from "@/components/ui/input";
import TagPicker from "./TagPicker";
import { THRIFT_CONDITIONS, THRIFT_SIZE_OPTIONS, THRIFT_COLOR_OPTIONS } from "@/lib/thrift-config";

interface ThriftComposerProps {
  condition: string; onConditionChange: (v: string) => void;
  size: string; onSizeChange: (v: string) => void;
  color: string; onColorChange: (v: string) => void;
  brand: string; onBrandChange: (v: string) => void;
}

// Deliberately does NOT import VariantsAccordion, TagPicker's AI-related props,
// aesthetics, package size, or any fashion attribute field. Thrift has none of
// these — not hidden, structurally absent.
export default function ThriftComposer({
  condition, onConditionChange,
  size, onSizeChange,
  color, onColorChange,
  brand, onBrandChange,
}: ThriftComposerProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Condition *</p>
        <div className="grid grid-cols-2 gap-2">
          {THRIFT_CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onConditionChange(c.value)}
              className={`text-left p-2.5 rounded-xl border-2 transition-all ${
                condition === c.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <p className="text-xs font-bold">{c.label}</p>
              <p className="text-[10px] text-muted-foreground">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <TagPicker label="Size" options={THRIFT_SIZE_OPTIONS} value={size} onChange={(v) => onSizeChange(v as string)} />
      <TagPicker label="Color" options={THRIFT_COLOR_OPTIONS} value={color} onChange={(v) => onColorChange(v as string)} />
      <Input placeholder="Brand (optional)" value={brand} onChange={(e) => onBrandChange(e.target.value)} className="rounded-xl h-11" />
    </div>
  );
}

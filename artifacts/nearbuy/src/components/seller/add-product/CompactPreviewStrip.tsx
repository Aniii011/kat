import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

interface CompactPreviewStripProps {
  imageUrl?: string;
  title: string;
  buyerPrice: number;
  // Opaque, composer-provided content shown only when expanded — kept generic
  // so this component doesn't need to know about attributes/variants/etc.
  // This is intentionally NOT a recreation of the old full-page Review step.
  expandedContent?: React.ReactNode;
}

export default function CompactPreviewStrip({
  imageUrl,
  title,
  buyerPrice,
  expandedContent,
}: CompactPreviewStripProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => expandedContent && setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-muted shrink-0" />
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-semibold truncate">{title || "Untitled product"}</p>
          <p className="text-xs font-black text-primary">{formatNaira(buyerPrice)}</p>
        </div>
        {expandedContent &&
          (expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ))}
      </button>
      {expanded && expandedContent && (
        <div className="px-3 pb-3 border-t border-border pt-3">{expandedContent}</div>
      )}
    </div>
  );
}

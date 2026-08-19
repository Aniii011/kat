import React from "react";
import type { ProductVariant } from "@/lib/product-variants";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

interface ReviewData {
  images: string[];
  title: string;
  category: string;
  subcategory: string;
  description: string;
  attributes: Record<string, string>;
  variants: ProductVariant[];
  buyerPrice: number;
  stockCount: string;
  isThrift: boolean;
  thriftCondition: string;
}

export default function ReviewStep({ data }: { data: ReviewData }) {
  const shownAttributes = Object.entries(data.attributes).filter(([, v]) => v);
  return (
    <div className="space-y-4">
      {data.images[0] ? (
        <img src={data.images[0]} alt="" className="w-full aspect-square object-cover rounded-2xl" />
      ) : (
        <div className="w-full aspect-square rounded-2xl bg-muted flex items-center justify-center text-xs text-muted-foreground">
          No image added
        </div>
      )}
      {data.images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {data.images.slice(1).map((img, i) => (
            <img key={i} src={img} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
          ))}
        </div>
      )}

      <div>
        <h2 className="font-black text-lg">{data.title || "Untitled product"}</h2>
        <p className="text-xs text-muted-foreground">{[data.category, data.subcategory].filter(Boolean).join(" › ") || "No category selected"}</p>
      </div>

      <div className="bg-primary/5 rounded-xl p-3">
        <span className="text-xl font-black text-primary">{formatNaira(data.buyerPrice)}</span>
        <span className="text-xs text-muted-foreground ml-2">buyer pays</span>
      </div>

      {data.isThrift && (
        <div className="text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 px-3 py-2 rounded-xl">
          Thrift item{data.thriftCondition ? ` — condition: ${data.thriftCondition.replace("_", " ")}` : ""}
        </div>
      )}

      {data.description && <p className="text-sm text-muted-foreground">{data.description}</p>}

      {shownAttributes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {shownAttributes.map(([k, v]) => (
            <span key={k} className="text-[11px] bg-muted px-2.5 py-1 rounded-full">{k}: {v}</span>
          ))}
        </div>
      )}

      {data.variants.length > 0 && (
        <p className="text-xs font-bold text-muted-foreground">{data.variants.length} variant(s) configured</p>
      )}

      <p className="text-xs text-muted-foreground">Stock: {data.stockCount || "—"}</p>
      <p className="text-xs text-muted-foreground italic">This is roughly what buyers will see once published.</p>
    </div>
  );
}

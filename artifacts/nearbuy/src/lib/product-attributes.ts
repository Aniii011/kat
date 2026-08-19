export type AttributeType = "select" | "multiselect" | "text" | "number";

export interface AttributeField {
  id: string;
  label: string;
  type: AttributeType;
  options?: string[];
  required?: boolean;
}

export const ATTRIBUTE_GROUPS: Record<string, AttributeField[]> = {
  "fashion-core": [
    { id: "audience", label: "Audience", type: "select", options: ["Women", "Men", "Girls", "Boys", "Babies", "Teens", "Unisex"] },
    { id: "fit", label: "Fit", type: "select", options: ["Slim", "Regular", "Loose", "Oversized"] },
    { id: "length", label: "Length", type: "select", options: ["Short", "Midi", "Long"] },
    { id: "material", label: "Material", type: "select", options: ["Cotton", "Linen", "Denim", "Polyester", "Silk", "Wool", "Leather", "Chiffon", "Ankara", "Lace"] },
    { id: "occasion", label: "Occasion", type: "select", options: ["Casual", "Formal", "Party", "Office", "Sports", "Beach", "Wedding", "Everyday"] },
  ],
  "shoes-core": [
    { id: "material", label: "Material", type: "select", options: ["Leather", "Canvas", "Suede", "Synthetic", "Rubber"] },
    { id: "shoe_type", label: "Shoe Type", type: "select", options: ["Sneakers", "Heels", "Sandals", "Boots", "Flats", "Platforms"] },
  ],
  "electronics-core": [
    { id: "storage", label: "Storage", type: "select", options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
    { id: "ram", label: "RAM", type: "select", options: ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB"] },
    { id: "condition", label: "Condition", type: "select", options: ["New", "Used - Like New", "Used - Good", "Used - Fair"] },
    { id: "warranty", label: "Warranty", type: "select", options: ["None", "3 months", "6 months", "1 year"] },
  ],
  "bags-core": [
    { id: "bag_type", label: "Bag Type", type: "select", options: ["Tote", "Backpack", "Clutch", "Crossbody", "Handbag"] },
    { id: "material", label: "Material", type: "select", options: ["Leather", "Canvas", "Suede", "Synthetic", "Nylon"] },
    { id: "closure_type", label: "Closure", type: "select", options: ["Zip", "Magnetic", "Drawstring", "Buckle"] },
  ],
};

// Subcategory label (from @/data/listings SUBCATEGORIES) -> attribute group keys.
// Unlisted subcategories simply get no Attributes step.
export const SUBCATEGORY_ATTRIBUTE_GROUPS: Record<string, string[]> = {
  "Dresses": ["fashion-core"], "Tops": ["fashion-core"], "T-shirts": ["fashion-core"],
  "Sweatshirts": ["fashion-core"], "Jeans": ["fashion-core"], "Bottoms": ["fashion-core"],
  "Knitwear": ["fashion-core"], "Co-ords": ["fashion-core"], "Denim": ["fashion-core"],
  "Pants": ["fashion-core"], "Pants & Jackets": ["fashion-core"], "Jumpsuits & Blouses": ["fashion-core"],
  "Bodysuits": ["fashion-core"], "Tank Tops": ["fashion-core"], "Hoodies & Sweatshirts": ["fashion-core"],
  "Shirts": ["fashion-core"], "Polo Shirts": ["fashion-core"], "Jackets & Coats": ["fashion-core"],
  "Winter Coats": ["fashion-core"], "Outerwear": ["fashion-core"], "Suits": ["fashion-core"],
  "Heels": ["shoes-core"], "Sandals": ["shoes-core"], "Platforms": ["shoes-core"],
  "Sneakers": ["shoes-core"], "Flats": ["shoes-core"],
  "Cases": ["electronics-core"], "Chargers": ["electronics-core"], "Earphones": ["electronics-core"], "Powerbanks": ["electronics-core"],
  "Bags": ["bags-core"],
};

// Field ids with a dedicated `products` column (write there, not into attributes jsonb).
export const NATIVE_ATTRIBUTE_COLUMNS = new Set(["audience", "fit", "length", "material", "occasion"]);

export function getAttributeFieldsForSubcategory(subcategory: string | null | undefined): AttributeField[] {
  if (!subcategory) return [];
  const groupKeys = SUBCATEGORY_ATTRIBUTE_GROUPS[subcategory];
  if (!groupKeys) return [];
  const seen = new Set<string>();
  const fields: AttributeField[] = [];
  for (const key of groupKeys) {
    for (const field of ATTRIBUTE_GROUPS[key] || []) {
      if (seen.has(field.id)) continue;
      seen.add(field.id);
      fields.push(field);
    }
  }
  return fields;
}

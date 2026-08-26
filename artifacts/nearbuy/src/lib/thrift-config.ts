import { COLORS, CLOTHING_SIZES } from "./product-option-sets";

export const THRIFT_CONDITIONS = [
  { value: "new", label: "New", desc: "Never worn, with tags" },
  { value: "like_new", label: "Like New", desc: "Worn once or twice, no flaws" },
  { value: "good", label: "Good", desc: "Minor signs of wear" },
  { value: "fair", label: "Fair", desc: "Visible wear, still functional" },
];

export const THRIFT_SIZE_OPTIONS = CLOTHING_SIZES;
export const THRIFT_COLOR_OPTIONS = COLORS;
export const THRIFT_DEFAULT_STOCK = "1";

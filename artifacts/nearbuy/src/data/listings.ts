export type Aesthetic =
  | "Old Money"
  | "Baddie"
  | "Boho"
  | "90s African Aunty"
  | "Clean Girl"
  | "Streetwear"
  | "Vacay"
  | "Soft Girl";

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  description: string;
  brand?: string;
  imageUrl: string;
  images: string[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
  sold: number;
  inStock: boolean;
  stockCount: number;
  freeShipping: boolean;
  shippingDays: number;
  sellerName: string;
  sellerAvatar?: string;
  sellerRating: number;
  sellerFollowers?: number;
  isVerifiedSeller: boolean;
  badge?: "Best Seller" | "Hot Deal" | "New" | "Trending" | "Limited";
  colors?: string[];
  clothingSizes?: string[];
  shoeSizes?: string[];
  aesthetics?: Aesthetic[];
  isThrift?: boolean;
  depositAmount?: number;
  isFeatured?: boolean;
  tags?: string[];
  colorImages?: Record<string, string>;
customSizeNote?: string;
}

export const TOP_CATEGORIES = [
  "Woman", "Men", "Kids", "Shoes",
  "Jewelry & Accessories", "Beauty & Health",
  "Gym & Outdoor", "Phone & Accessories", "Home",
  "Thrift", "Deals",
] as const;

export type TopCategory = (typeof TOP_CATEGORIES)[number];

export const SUBCATEGORIES: Record<TopCategory, string[]> = {
  Woman: ["Dresses", "Tops", "T-shirts", "Sweatshirts", "Jeans", "Bottoms", "Bags", "Knitwear", "Co-ords", "Denim", "Caps", "Tank Tops", "Pants & Jackets", "Pants", "Jumpsuits & Blouses", "Bodysuits", "Bikini Sets", "Beauty & Health", "Wigs"],
  Men: ["Tops", "Bottoms", "Denim", "Hoodies & Sweatshirts", "Suits", "Shirts", "Co-ords", "Outerwear", "Plus Size", "Polo Shirts", "Knitwear", "Jackets & Coats", "Winter Coats", "Underwear & Sleepwear"],
  Kids: ["Tops", "Bottoms", "Pyjamas", "Dresses", "Jeans", "Toys", "Books", "Games"],
  Shoes: ["Heels", "Sandals", "Platforms", "Sneakers", "Flats"],
  "Jewelry & Accessories": ["Gloves", "Hats", "Scarfs", "Belts", "Hair Accessories", "Body Jewelry", "Necklaces", "Earrings", "Rings", "Glasses"],
  "Beauty & Health": ["Skincare", "Perfume", "Makeup", "Hair Care", "Body Care", "Wigs"],
  "Gym & Outdoor": ["Gym Wear", "Co-ords", "Gym Equipment", "Sports Accessories"],
  "Phone & Accessories": ["Cases", "Chargers", "Earphones", "Powerbanks"],
  Home: ["Grocery", "Appliances", "Kitchen", "Tools", "Furniture", "Office & School Supplies"],
  Thrift: [],
  Deals: [],
};

export const CATEGORY_TO_TOP: Record<string, TopCategory> = {
  "Co-ords": "Woman", "Women": "Woman", "Tops": "Woman", "Bottoms": "Woman",
  "Wigs & Hair": "Woman", "Underwear & Sleepwear": "Woman", "Swimwear": "Woman",
  "Denim": "Woman", "Plus Size Fashion": "Woman",
  "Heels": "Shoes", "Sneakers": "Shoes",
  "Jewellery & Accessories": "Jewelry & Accessories",
  "Beauty": "Beauty & Health", "Gym Wear": "Gym & Outdoor",
  "Clothing": "Woman",
};

export const AESTHETICS: { label: Aesthetic; emoji: string }[] = [
  { label: "Old Money", emoji: "👜" },
  { label: "Baddie", emoji: "💅" },
  { label: "Boho", emoji: "🌸" },
  { label: "90s African Aunty", emoji: "🌺" },
  { label: "Clean Girl", emoji: "✨" },
  { label: "Streetwear", emoji: "🔥" },
  { label: "Vacay", emoji: "🌴" },
  { label: "Soft Girl", emoji: "🎀" },
];

export const CATEGORIES = [
  "All", ...TOP_CATEGORIES.filter((c) => c !== "Thrift" && c !== "Deals"),
];

// Empty — all products come from Supabase
export const listings: Listing[] = [];

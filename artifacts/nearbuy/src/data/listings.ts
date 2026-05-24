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
  id: number;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
}

export interface Listing {
  id: number;
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
}

// ── Hierarchical categories ─────────────────────────────────
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

export const listings: Listing[] = [
  {
    id: 1, title: "Ankara Co-ord Blazer & Wide-Leg Set", price: 18500, originalPrice: 25000, discount: 26, category: "Co-ords",
    description: "Stunning ankara print co-ord set featuring a structured blazer and matching wide-leg trousers. Made from premium Dutch wax fabric. Perfect for owambe parties, corporate events, or elevating your everyday look.",
    brand: "Adire House", imageUrl: "https://picsum.photos/seed/f1/400/500",
    images: ["https://picsum.photos/seed/f1/400/500","https://picsum.photos/seed/f1b/400/500","https://picsum.photos/seed/f1c/400/500"],
    rating: 4.9, reviewCount: 214, reviews: [
      { id: 1, author: "Chidinma O.", avatar: "https://picsum.photos/seed/a1/40/40", rating: 5, date: "May 8, 2025", title: "Absolutely stunning!", body: "Got so many compliments at my cousin's wedding. Quality is top tier and fits TTS. The colours are vibrant!", verified: true },
      { id: 2, author: "Temi A.", avatar: "https://picsum.photos/seed/a2/40/40", rating: 5, date: "Apr 22, 2025", title: "Seller is an angel", body: "Packaged beautifully, delivered fast. I wore it to a corporate dinner and everyone was asking where I got it from.", verified: true },
    ],
    sold: 89, inStock: true, stockCount: 12, freeShipping: true, shippingDays: 2,
    sellerName: "Adire House", sellerAvatar: "https://picsum.photos/seed/s1/40/40", sellerRating: 4.9, sellerFollowers: 12400, isVerifiedSeller: true,
    badge: "Best Seller", colors: ["Red/Gold","Blue/White","Green/Orange","Purple/Yellow"], clothingSizes: ["XS","S","M","L","XL","XXL"],
    aesthetics: ["90s African Aunty","Old Money"], isFeatured: true, tags: ["ankara","co-ord","owambe","party","corporate"],
  },
  {
    id: 2, title: "Baddie Bodycon Slit Dress", price: 12000, originalPrice: 18000, discount: 33, category: "Women",
    description: "Sleek floor-length bodycon dress with a thigh-high slit. Stretchy fabric hugs every curve. Perfect for girls' night out, parties, or date night. Available in multiple head-turning colours.",
    imageUrl: "https://picsum.photos/seed/f2/400/500",
    images: ["https://picsum.photos/seed/f2/400/500","https://picsum.photos/seed/f2b/400/500","https://picsum.photos/seed/f2c/400/500"],
    rating: 4.7, reviewCount: 178, reviews: [
      { id: 1, author: "Blessing N.", avatar: "https://picsum.photos/seed/a3/40/40", rating: 5, date: "May 10, 2025", title: "ATE this look 🔥", body: "I wore this to a birthday party and I was THE moment. Fit is perfect, very stretchy but keeps its shape.", verified: true },
    ],
    sold: 143, inStock: true, stockCount: 8, freeShipping: false, shippingDays: 3,
    sellerName: "Glam by Nkechi", sellerAvatar: "https://picsum.photos/seed/s2/40/40", sellerRating: 4.7, sellerFollowers: 8900, isVerifiedSeller: true,
    badge: "Trending", colors: ["Jet Black","Fire Red","Cobalt Blue","Champagne"], clothingSizes: ["XS","S","M","L","XL"],
    aesthetics: ["Baddie"], isFeatured: true, tags: ["bodycon","party","date night","slit dress"],
  },
  {
    id: 3, title: "Old Money Cream Linen Blazer Set", price: 42000, originalPrice: 58000, discount: 28, category: "Co-ords",
    description: "Effortlessly sophisticated cream linen blazer with matching tailored trousers. Minimalist, clean, and luxurious. Wear it to brunch, a business meeting, or pair the blazer over a bikini on a yacht.",
    brand: "Lagos Luxe", imageUrl: "https://picsum.photos/seed/f3/400/500",
    images: ["https://picsum.photos/seed/f3/400/500","https://picsum.photos/seed/f3b/400/500","https://picsum.photos/seed/f3c/400/500"],
    rating: 4.9, reviewCount: 93, reviews: [
      { id: 1, author: "Adaeze M.", avatar: "https://picsum.photos/seed/a4/40/40", rating: 5, date: "May 5, 2025", title: "Worth every kobo", body: "The fabric quality is incredible. I've worn this to 3 events already. I always feel like a whole CEO.", verified: true },
    ],
    sold: 41, inStock: true, stockCount: 5, freeShipping: true, shippingDays: 2,
    sellerName: "Lagos Luxe", sellerAvatar: "https://picsum.photos/seed/s3/40/40", sellerRating: 5.0, sellerFollowers: 22100, isVerifiedSeller: true,
    badge: "Best Seller", colors: ["Cream","Camel","Sage Green","Black"], clothingSizes: ["XS","S","M","L","XL"],
    aesthetics: ["Old Money","Clean Girl"], isFeatured: true, tags: ["blazer","linen","luxury","old money","minimalist"],
  },
  {
    id: 4, title: "Brazilian Body Wave Lace Front Wig", price: 48000, originalPrice: 65000, discount: 26, category: "Wigs & Hair",
    description: "100% virgin Brazilian human hair body wave wig with HD lace frontal. 18 inches. Pre-plucked hairline with baby hairs. Bouncy, glossy, and incredibly natural-looking.",
    imageUrl: "https://picsum.photos/seed/f4/400/500",
    images: ["https://picsum.photos/seed/f4/400/500","https://picsum.photos/seed/f4b/400/500","https://picsum.photos/seed/f4c/400/500"],
    rating: 4.8, reviewCount: 312, reviews: [
      { id: 1, author: "Funmi B.", avatar: "https://picsum.photos/seed/a5/40/40", rating: 5, date: "May 12, 2025", title: "Insanely natural!", body: "This wig had everyone convinced it was my real hair. The lace is so transparent and the hair is so soft. 10/10!", verified: true },
      { id: 2, author: "Kemi D.", avatar: "https://picsum.photos/seed/a6/40/40", rating: 4, date: "Apr 28, 2025", title: "Gorgeous wig", body: "Beautiful quality. Delivery was fast. One star off because the bleaching on the knots could be a little better.", verified: true },
    ],
    sold: 201, inStock: true, stockCount: 15, freeShipping: true, shippingDays: 1,
    sellerName: "Glam Wig Factory", sellerAvatar: "https://picsum.photos/seed/s4/40/40", sellerRating: 4.8, sellerFollowers: 31000, isVerifiedSeller: true,
    badge: "Hot Deal", colors: ["Natural Black","Dark Brown","Chestnut"], aesthetics: ["Baddie","Clean Girl","Old Money"], isFeatured: true,
    tags: ["wig","hair","lace front","human hair","brazilian"],
  },
  {
    id: 5, title: "Clean Girl Gold Layered Chain Set", price: 8500, originalPrice: 13000, discount: 35, category: "Jewellery & Accessories",
    description: "Dainty layered gold chain set — includes a choker, 16-inch, and 18-inch chain. 18K gold plated, tarnish-resistant. The perfect everyday jewellery stack for a clean, minimal aesthetic.",
    imageUrl: "https://picsum.photos/seed/f5/400/500",
    images: ["https://picsum.photos/seed/f5/400/500","https://picsum.photos/seed/f5b/400/500"],
    rating: 4.6, reviewCount: 445, reviews: [
      { id: 1, author: "Zara L.", avatar: "https://picsum.photos/seed/a7/40/40", rating: 5, date: "May 9, 2025", title: "So delicate and pretty", body: "Bought two sets — one for me and one for my sister. Still wearing mine everyday and no tarnish after 3 weeks!", verified: true },
    ],
    sold: 380, inStock: true, stockCount: 50, freeShipping: true, shippingDays: 2,
    sellerName: "Lush Jewels NG", sellerAvatar: "https://picsum.photos/seed/s5/40/40", sellerRating: 4.6, sellerFollowers: 9800, isVerifiedSeller: true,
    badge: "Best Seller", colors: ["Gold","Silver","Rose Gold"], aesthetics: ["Clean Girl","Old Money","Soft Girl"],
    tags: ["jewellery","gold","chain","minimal","layered"],
  },
  {
    id: 6, title: "Oversized Streetwear Graphic Hoodie", price: 15500, originalPrice: 22000, discount: 30, category: "Tops",
    description: "Heavyweight 380GSM fleece hoodie with a bold Lagos skyline graphic. Oversized fit, kangaroo pocket, and ribbed cuffs. Heavy and warm — perfect for cool Lagos nights.",
    imageUrl: "https://picsum.photos/seed/f6/400/500",
    images: ["https://picsum.photos/seed/f6/400/500","https://picsum.photos/seed/f6b/400/500"],
    rating: 4.8, reviewCount: 127, reviews: [
      { id: 1, author: "Seun A.", avatar: "https://picsum.photos/seed/a8/40/40", rating: 5, date: "May 1, 2025", title: "Heaviest hoodie I own", body: "The fabric is so thick and premium. Wearing it oversized over biker shorts = entire outfit. Very much the vibe.", verified: true },
    ],
    sold: 89, inStock: true, stockCount: 20, freeShipping: false, shippingDays: 3,
    sellerName: "Nine01 Brand", sellerAvatar: "https://picsum.photos/seed/s6/40/40", sellerRating: 4.8, sellerFollowers: 15700, isVerifiedSeller: true,
    badge: "Trending", colors: ["Black","Washed Grey","Army Green","Burgundy"], clothingSizes: ["S","M","L","XL","XXL"],
    aesthetics: ["Streetwear"], tags: ["hoodie","streetwear","graphic","oversized","lagos"],
  },
  {
    id: 7, title: "Vacay Crocheted Bikini Set", price: 11000, originalPrice: 16500, discount: 33, category: "Swimwear",
    description: "Handmade crochet bikini set with adjustable ties. Comes with a matching cover-up skirt. Perfect for beach holidays, poolside sessions, or island getaways.",
    imageUrl: "https://picsum.photos/seed/f7/400/500",
    images: ["https://picsum.photos/seed/f7/400/500","https://picsum.photos/seed/f7b/400/500"],
    rating: 4.7, reviewCount: 88, reviews: [
      { id: 1, author: "Priscilla E.", avatar: "https://picsum.photos/seed/a9/40/40", rating: 5, date: "Apr 20, 2025", title: "Wore this in Zanzibar!", body: "It photographed so beautifully. The cover-up skirt is a great bonus. Got so many DMs asking where I got it.", verified: true },
    ],
    sold: 62, inStock: true, stockCount: 10, freeShipping: true, shippingDays: 3,
    sellerName: "Island Girl Threads", sellerAvatar: "https://picsum.photos/seed/s7/40/40", sellerRating: 4.7, sellerFollowers: 6200, isVerifiedSeller: false,
    badge: "New", colors: ["White","Coral","Sage","Chocolate Brown"], clothingSizes: ["XS","S","M","L"],
    aesthetics: ["Vacay","Boho"], tags: ["bikini","swimwear","beach","crochet","vacay"],
  },
  {
    id: 8, title: "Boho Floral Chiffon Maxi Dress", price: 22000, originalPrice: 30000, discount: 27, category: "Women",
    description: "Flowy chiffon maxi dress with a beautiful tropical floral print. V-neckline, tiered skirt, and adjustable waist tie. Effortlessly feminine for beach weddings, garden brunches, or sightseeing.",
    imageUrl: "https://picsum.photos/seed/f8/400/500",
    images: ["https://picsum.photos/seed/f8/400/500","https://picsum.photos/seed/f8b/400/500"],
    rating: 4.8, reviewCount: 156, reviews: [
      { id: 1, author: "Amaka C.", avatar: "https://picsum.photos/seed/a10/40/40", rating: 5, date: "May 3, 2025", title: "Dreamy dress", body: "This dress flows so beautifully. I wore it to a garden wedding and everyone complimented me. Runs true to size.", verified: true },
    ],
    sold: 75, inStock: true, stockCount: 8, freeShipping: true, shippingDays: 2,
    sellerName: "Bloom & Thread", sellerAvatar: "https://picsum.photos/seed/s8/40/40", sellerRating: 4.8, sellerFollowers: 11200, isVerifiedSeller: true,
    badge: "Best Seller", colors: ["Tropical Blue","Dusty Rose","Ivory/Green"], clothingSizes: ["XS","S","M","L","XL"],
    aesthetics: ["Boho","Vacay","Soft Girl"], tags: ["maxi dress","floral","boho","chiffon","wedding guest"],
  },
  {
    id: 9, title: "Platform Chunky Sneakers", price: 28500, originalPrice: 38000, discount: 25, category: "Sneakers",
    description: "90s-inspired chunky platform sneakers with a 4cm sole. Genuine leather upper, cushioned insole. A streetwear and clean-girl staple that elevates any outfit.",
    imageUrl: "https://picsum.photos/seed/f9/400/500",
    images: ["https://picsum.photos/seed/f9/400/500","https://picsum.photos/seed/f9b/400/500"],
    rating: 4.7, reviewCount: 203, reviews: [
      { id: 1, author: "Tola F.", avatar: "https://picsum.photos/seed/a11/40/40", rating: 5, date: "Apr 30, 2025", title: "These shoes are EVERYTHING", body: "So comfortable and look amazing. I've worn them 3 days in a row. Everyone asks where they're from.", verified: true },
    ],
    sold: 155, inStock: true, stockCount: 18, freeShipping: true, shippingDays: 2,
    sellerName: "Sole Story NG", sellerAvatar: "https://picsum.photos/seed/s9/40/40", sellerRating: 4.7, sellerFollowers: 18500, isVerifiedSeller: true,
    badge: "Trending", colors: ["Triple White","Black/White","Cream/Brown"], shoeSizes: ["36","37","38","39","40","41","42"],
    aesthetics: ["Clean Girl","Streetwear","90s African Aunty"], tags: ["sneakers","platform","chunky","shoes"],
  },
  {
    id: 10, title: "Soft Girl Satin Slip Pyjama Set", price: 14000, originalPrice: 19500, discount: 28, category: "Underwear & Sleepwear",
    description: "Silky smooth satin pyjama set with lace trim. Shorts and cami top with adjustable straps. So luxurious you'll want to wear it everywhere. Available in the most beautiful pastel shades.",
    imageUrl: "https://picsum.photos/seed/f10/400/500",
    images: ["https://picsum.photos/seed/f10/400/500","https://picsum.photos/seed/f10b/400/500"],
    rating: 4.9, reviewCount: 267, reviews: [
      { id: 1, author: "Ngozi P.", avatar: "https://picsum.photos/seed/a12/40/40", rating: 5, date: "May 7, 2025", title: "Feels like clouds", body: "The fabric is so soft and cool against the skin. I bought all 4 colours. Perfect birthday gift idea too!", verified: true },
    ],
    sold: 219, inStock: true, stockCount: 30, freeShipping: true, shippingDays: 2,
    sellerName: "Lush Luxe Loungewear", sellerAvatar: "https://picsum.photos/seed/s10/40/40", sellerRating: 4.9, sellerFollowers: 14300, isVerifiedSeller: true,
    badge: "Best Seller", colors: ["Dusty Rose","Baby Blue","Lilac","Champagne"], clothingSizes: ["XS","S","M","L","XL"],
    aesthetics: ["Soft Girl"], tags: ["pyjama","satin","sleepwear","soft girl","loungewear"],
  },
  {
    id: 11, title: "90s Aunty Kente Print Blouse", price: 9500, originalPrice: 14000, discount: 32, category: "Tops",
    description: "A proud celebration of African fashion. Bold kente-inspired print blouse with structured shoulders and peplum hem. Pairs beautifully with wide-leg trousers or a midi skirt.",
    imageUrl: "https://picsum.photos/seed/f11/400/500",
    images: ["https://picsum.photos/seed/f11/400/500","https://picsum.photos/seed/f11b/400/500"],
    rating: 4.8, reviewCount: 134, reviews: [
      { id: 1, author: "Adesuwa K.", avatar: "https://picsum.photos/seed/a13/40/40", rating: 5, date: "May 2, 2025", title: "My ancestors are proud", body: "This blouse is giving everything! I wore it to church and my aunties almost started a bidding war for it.", verified: true },
    ],
    sold: 98, inStock: true, stockCount: 14, freeShipping: false, shippingDays: 3,
    sellerName: "Adire House", sellerAvatar: "https://picsum.photos/seed/s1/40/40", sellerRating: 4.9, sellerFollowers: 12400, isVerifiedSeller: true,
    colors: ["Multi-Kente","Blue/Gold","Red/Black"], clothingSizes: ["XS","S","M","L","XL","XXL"],
    aesthetics: ["90s African Aunty"], tags: ["kente","african print","blouse","peplum","top"],
  },
  {
    id: 12, title: "Gym Set – Sports Bra & High Waist Leggings", price: 19500, originalPrice: 27000, discount: 28, category: "Gym Wear",
    description: "Squat-proof, sweat-wicking gym set. Sports bra with built-in padding and matching high-waist leggings with ribbed waistband. Sculpting fit that hugs your curves perfectly.",
    imageUrl: "https://picsum.photos/seed/f12/400/500",
    images: ["https://picsum.photos/seed/f12/400/500","https://picsum.photos/seed/f12b/400/500"],
    rating: 4.9, reviewCount: 389, reviews: [
      { id: 1, author: "Racheal I.", avatar: "https://picsum.photos/seed/a14/40/40", rating: 5, date: "May 11, 2025", title: "Best gym wear ever!", body: "These leggings are truly squat-proof. I've washed mine 10 times and they still look brand new. Worth every penny.", verified: true },
    ],
    sold: 302, inStock: true, stockCount: 25, freeShipping: true, shippingDays: 2,
    sellerName: "FitGirl NG", sellerAvatar: "https://picsum.photos/seed/s12/40/40", sellerRating: 4.9, sellerFollowers: 26800, isVerifiedSeller: true,
    badge: "Best Seller", colors: ["Burnt Orange","Deep Purple","Forest Green","Black","Hot Pink"], clothingSizes: ["XS","S","M","L","XL"],
    aesthetics: ["Clean Girl","Baddie"], isFeatured: true, tags: ["gym","leggings","sports bra","fitness","workout"],
  },
  {
    id: 13, title: "Clear Rhinestone Barely There Heels", price: 32000, originalPrice: 45000, discount: 29, category: "Heels",
    description: "Ultra-glam crystal clear PVC barely-there heels with all-over rhinestone straps. 10cm stiletto heel. Perfect for weddings, proms, nightclubs, or whenever you need to be the most dressed person in the room.",
    imageUrl: "https://picsum.photos/seed/f13/400/500",
    images: ["https://picsum.photos/seed/f13/400/500","https://picsum.photos/seed/f13b/400/500"],
    rating: 4.6, reviewCount: 178, reviews: [
      { id: 1, author: "Sade A.", avatar: "https://picsum.photos/seed/a15/40/40", rating: 5, date: "Apr 15, 2025", title: "Cinderella energy", body: "These heels are absolutely gorgeous in person. The rhinestones catch the light so beautifully. Very comfortable too!", verified: true },
    ],
    sold: 112, inStock: true, stockCount: 9, freeShipping: true, shippingDays: 2,
    sellerName: "Sole Story NG", sellerAvatar: "https://picsum.photos/seed/s9/40/40", sellerRating: 4.7, sellerFollowers: 18500, isVerifiedSeller: true,
    badge: "Trending", colors: ["Clear/Crystal","Gold Rhinestone","Silver Rhinestone"], shoeSizes: ["36","37","38","39","40","41"],
    aesthetics: ["Baddie","Old Money"], tags: ["heels","rhinestone","glam","party shoes","stiletto"],
  },
  {
    id: 14, title: "Black Girl Glow Vitamin C Serum", price: 7500, originalPrice: 10000, discount: 25, category: "Beauty",
    description: "Formulated specifically for melanin-rich skin. 20% Vitamin C + Niacinamide + Hyaluronic Acid. Fades dark spots, hyperpigmentation, and post-blemish marks. Dermatologist-tested, cruelty-free, and made in Nigeria.",
    brand: "Glow Ritual", imageUrl: "https://picsum.photos/seed/f14/400/500",
    images: ["https://picsum.photos/seed/f14/400/500","https://picsum.photos/seed/f14b/400/500"],
    rating: 4.9, reviewCount: 521, reviews: [
      { id: 1, author: "Obiageli T.", avatar: "https://picsum.photos/seed/a16/40/40", rating: 5, date: "May 10, 2025", title: "My skin is GLOWING", body: "I've been using this for 6 weeks and my dark spots have faded so much. My skin is the clearest it's been in years!", verified: true },
      { id: 2, author: "Ifeoma N.", avatar: "https://picsum.photos/seed/a17/40/40", rating: 5, date: "Apr 27, 2025", title: "Game changer", body: "Nigerian brand done right! This serum works better than expensive foreign ones I've tried.", verified: true },
    ],
    sold: 431, inStock: true, stockCount: 40, freeShipping: true, shippingDays: 1,
    sellerName: "Glow Ritual", sellerAvatar: "https://picsum.photos/seed/s14/40/40", sellerRating: 5.0, sellerFollowers: 44200, isVerifiedSeller: true,
    badge: "Best Seller", aesthetics: ["Clean Girl"], isFeatured: true, tags: ["skincare","vitamin c","serum","glow","dark spots"],
  },
  {
    id: 15, title: "Denim Corset Crop Top", price: 13500, originalPrice: 19000, discount: 29, category: "Denim",
    description: "Structured denim corset crop top with boning detail and hook-and-eye closure. A must-have wardrobe piece. Style with a maxi skirt for old money vibes or oversized jeans for that baddie look.",
    imageUrl: "https://picsum.photos/seed/f15/400/500",
    images: ["https://picsum.photos/seed/f15/400/500","https://picsum.photos/seed/f15b/400/500"],
    rating: 4.7, reviewCount: 143, reviews: [
      { id: 1, author: "Yewande B.", avatar: "https://picsum.photos/seed/a18/40/40", rating: 5, date: "May 6, 2025", title: "So versatile!", body: "This top goes with literally everything. I've styled it 5 different ways already. Quality is amazing.", verified: true },
    ],
    sold: 107, inStock: true, stockCount: 16, freeShipping: false, shippingDays: 3,
    sellerName: "Glam by Nkechi", sellerAvatar: "https://picsum.photos/seed/s2/40/40", sellerRating: 4.7, sellerFollowers: 8900, isVerifiedSeller: true,
    colors: ["Classic Blue","Black Denim","White Denim"], clothingSizes: ["XS","S","M","L"],
    aesthetics: ["Baddie","Streetwear","Old Money"], tags: ["denim","corset","crop top","top"],
  },
  {
    id: 16, title: "Plus Size Wrap Midi Dress", price: 16500, originalPrice: 23000, discount: 28, category: "Plus Size Fashion",
    description: "A gorgeous flowy wrap midi dress that celebrates all body types. Adjustable tie waist flatters your curves beautifully. Soft, breathable fabric. Available in extended sizes 14–24.",
    imageUrl: "https://picsum.photos/seed/f16/400/500",
    images: ["https://picsum.photos/seed/f16/400/500","https://picsum.photos/seed/f16b/400/500"],
    rating: 4.9, reviewCount: 287, reviews: [
      { id: 1, author: "Chiamaka O.", avatar: "https://picsum.photos/seed/a19/40/40", rating: 5, date: "May 9, 2025", title: "Finally a brand that gets us!", body: "The fabric is premium and fits my size 22 frame so beautifully. I cried a little. Thank you for the inclusive sizing!", verified: true },
    ],
    sold: 198, inStock: true, stockCount: 22, freeShipping: true, shippingDays: 2,
    sellerName: "Curves & Co.", sellerAvatar: "https://picsum.photos/seed/s16/40/40", sellerRating: 4.9, sellerFollowers: 19600, isVerifiedSeller: true,
    badge: "Best Seller", colors: ["Burgundy","Forest Green","Navy Print","Terracotta"], clothingSizes: ["14","16","18","20","22","24"],
    aesthetics: ["Old Money","Boho"], tags: ["plus size","wrap dress","midi","curvy","inclusive"],
  },
  {
    id: 17, title: "Thrift: Y2K Butterfly Print Mini Skirt", price: 6000, category: "Bottoms",
    description: "One-of-one vintage Y2K butterfly print mini skirt. Genuine 2000s era piece. Approx UK 10 sizing. Excellent condition — no tears, no stains. You won't find another one like it.",
    imageUrl: "https://picsum.photos/seed/t1/400/500",
    images: ["https://picsum.photos/seed/t1/400/500","https://picsum.photos/seed/t1b/400/500"],
    rating: 5.0, reviewCount: 3, reviews: [
      { id: 1, author: "Kofo A.", avatar: "https://picsum.photos/seed/at1/40/40", rating: 5, date: "Apr 18, 2025", title: "Authentic vintage find!", body: "This skirt is exactly as described. The print is so unique and the quality of the original fabric is amazing.", verified: true },
    ],
    sold: 0, inStock: true, stockCount: 1, freeShipping: false, shippingDays: 4,
    sellerName: "Thrift Queen NG", sellerAvatar: "https://picsum.photos/seed/st1/40/40", sellerRating: 4.8, sellerFollowers: 7200, isVerifiedSeller: true,
    badge: "Limited", colors: ["Multicolour"], clothingSizes: ["S"],
    aesthetics: ["90s African Aunty","Boho"], isThrift: true, depositAmount: 2500, tags: ["thrift","vintage","y2k","mini skirt"],
  },
  {
    id: 18, title: "Thrift: Vintage Corduroy Blazer", price: 8500, category: "Clothing",
    description: "Authentic 1990s tan corduroy blazer. Fully lined, brass button detail, wide lapels. One-of-one — only 1 available. Perfect size M (UK 12). No moth holes, no stains.",
    imageUrl: "https://picsum.photos/seed/t2/400/500",
    images: ["https://picsum.photos/seed/t2/400/500","https://picsum.photos/seed/t2b/400/500"],
    rating: 4.9, reviewCount: 5, reviews: [
      { id: 1, author: "Nadia S.", avatar: "https://picsum.photos/seed/at2/40/40", rating: 5, date: "Apr 10, 2025", title: "This is a masterpiece", body: "The quality of vintage items vs. new production is night and day. This blazer is everything.", verified: true },
    ],
    sold: 0, inStock: true, stockCount: 1, freeShipping: false, shippingDays: 4,
    sellerName: "Thrift Queen NG", sellerAvatar: "https://picsum.photos/seed/st1/40/40", sellerRating: 4.8, sellerFollowers: 7200, isVerifiedSeller: true,
    badge: "Limited", colors: ["Tan Corduroy"], clothingSizes: ["M"],
    aesthetics: ["Old Money","90s African Aunty","Boho"], isThrift: true, depositAmount: 3000, tags: ["thrift","vintage","blazer","corduroy"],
  },
  {
    id: 19, title: "Thrift: 90s Band Tee – Fela Kuti", price: 12000, category: "Tops",
    description: "Rare authentic 1990s Fela Kuti concert tee. Faded, worn-in perfection. Size L. A genuine piece of Nigerian music history in wearable form. Only 1 exists — deposit to secure.",
    imageUrl: "https://picsum.photos/seed/t3/400/500",
    images: ["https://picsum.photos/seed/t3/400/500","https://picsum.photos/seed/t3b/400/500"],
    rating: 5.0, reviewCount: 8, reviews: [
      { id: 1, author: "Emeka P.", avatar: "https://picsum.photos/seed/at3/40/40", rating: 5, date: "May 1, 2025", title: "Cultural treasure", body: "I cannot believe this exists. My dad actually went to this concert. I will treasure this forever.", verified: true },
    ],
    sold: 0, inStock: true, stockCount: 1, freeShipping: false, shippingDays: 4,
    sellerName: "Afro Vintage Co.", sellerAvatar: "https://picsum.photos/seed/st2/40/40", sellerRating: 5.0, sellerFollowers: 5400, isVerifiedSeller: true,
    badge: "Limited", colors: ["Faded Black"], clothingSizes: ["L"],
    aesthetics: ["Streetwear","90s African Aunty"], isThrift: true, depositAmount: 4000, tags: ["thrift","vintage","fela kuti","band tee","nigerian"],
  },
];

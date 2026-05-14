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
  location: string;
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
  sellerRating: number;
  isVerifiedSeller: boolean;
  badge?: "Best Seller" | "Hot Deal" | "New";
  colors?: string[];
  sizes?: string[];
}

export const listings: Listing[] = [
  {
    id: 1,
    title: "Vintage Wooden Dining Table",
    price: 150,
    originalPrice: 220,
    discount: 32,
    category: "Furniture",
    description:
      "Solid oak dining table from the 1970s. Comfortably seats 6 people. Minor surface scratches but overall excellent structural condition. The natural wood grain gives it a warm, timeless look perfect for any dining room.",
    location: "Downtown",
    imageUrl: "https://picsum.photos/seed/1/800/600",
    images: [
      "https://picsum.photos/seed/1/800/600",
      "https://picsum.photos/seed/1a/800/600",
      "https://picsum.photos/seed/1b/800/600",
      "https://picsum.photos/seed/1c/800/600",
    ],
    rating: 4.8,
    reviewCount: 124,
    sold: 38,
    inStock: true,
    stockCount: 1,
    freeShipping: true,
    shippingDays: 3,
    sellerName: "Sarah Jenkins",
    sellerRating: 4.8,
    isVerifiedSeller: true,
    badge: "Best Seller",
    colors: ["Natural Oak", "Walnut", "White"],
    reviews: [
      { id: 1, author: "Maria T.", avatar: "https://picsum.photos/seed/r1/40/40", rating: 5, date: "Apr 28, 2025", title: "Absolutely beautiful!", body: "Arrived well-packaged and looks even better in person. The oak finish is gorgeous. Highly recommend.", verified: true },
      { id: 2, author: "James K.", avatar: "https://picsum.photos/seed/r2/40/40", rating: 5, date: "Mar 12, 2025", title: "Sturdy and stylish", body: "Seats my family of 6 easily. Very solid build. A few minor scratches as described but barely noticeable.", verified: true },
      { id: 3, author: "Linda P.", avatar: "https://picsum.photos/seed/r3/40/40", rating: 4, date: "Feb 5, 2025", title: "Great value", body: "Good quality for the price. Took a little while to arrive but was worth the wait.", verified: false },
    ],
  },
  {
    id: 2,
    title: "Mountain Bike – Trek Marlin 7",
    price: 350,
    originalPrice: 499,
    discount: 30,
    category: "Sports",
    description:
      "Barely used Trek Marlin 7 mountain bike. 29-inch wheels, 21-speed Shimano drivetrain. Kept indoors away from weather. Ideal for local trails, commuting, or weekend adventures.",
    location: "Westside",
    imageUrl: "https://picsum.photos/seed/2/800/600",
    images: [
      "https://picsum.photos/seed/2/800/600",
      "https://picsum.photos/seed/2a/800/600",
      "https://picsum.photos/seed/2b/800/600",
      "https://picsum.photos/seed/2c/800/600",
    ],
    rating: 4.6,
    reviewCount: 89,
    sold: 22,
    inStock: true,
    stockCount: 1,
    freeShipping: false,
    shippingDays: 5,
    sellerName: "Mike R.",
    sellerRating: 4.2,
    isVerifiedSeller: false,
    badge: "Hot Deal",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Matte Black", "Forest Green", "Slate Blue"],
    reviews: [
      { id: 1, author: "Chris B.", avatar: "https://picsum.photos/seed/r4/40/40", rating: 5, date: "May 2, 2025", title: "Perfect trail bike", body: "Exactly as described. Runs smoothly, gears shift perfectly. Great deal for the price!", verified: true },
      { id: 2, author: "Aisha N.", avatar: "https://picsum.photos/seed/r5/40/40", rating: 4, date: "Apr 14, 2025", title: "Good condition, fast shipping", body: "Minor paint scuff on the frame, not mentioned but otherwise flawless. Happy with the purchase.", verified: true },
    ],
  },
  {
    id: 3,
    title: "Sony A6000 Mirrorless Camera Kit",
    price: 400,
    originalPrice: 580,
    discount: 31,
    category: "Electronics",
    description:
      "Includes the 16-50mm OSS kit lens, original Sony battery, charger, and UV filter. Very low shutter count (~2,400). Sensor is pristine. Selling because I upgraded to full-frame.",
    location: "North Hills",
    imageUrl: "https://picsum.photos/seed/3/800/600",
    images: [
      "https://picsum.photos/seed/3/800/600",
      "https://picsum.photos/seed/3a/800/600",
      "https://picsum.photos/seed/3b/800/600",
      "https://picsum.photos/seed/3c/800/600",
    ],
    rating: 4.9,
    reviewCount: 213,
    sold: 67,
    inStock: true,
    stockCount: 2,
    freeShipping: true,
    shippingDays: 2,
    sellerName: "David Lee",
    sellerRating: 5.0,
    isVerifiedSeller: true,
    badge: "Best Seller",
    colors: ["Black"],
    reviews: [
      { id: 1, author: "Nina W.", avatar: "https://picsum.photos/seed/r6/40/40", rating: 5, date: "May 8, 2025", title: "Mint condition!", body: "Camera looks brand new. David was super responsive and packed it very carefully. 10/10 seller.", verified: true },
      { id: 2, author: "Tom H.", avatar: "https://picsum.photos/seed/r7/40/40", rating: 5, date: "Apr 20, 2025", title: "Incredible kit for the price", body: "Got everything listed. The lens is clean, no dust, and the shutter count is accurate. Very happy.", verified: true },
      { id: 3, author: "Grace L.", avatar: "https://picsum.photos/seed/r8/40/40", rating: 4, date: "Mar 9, 2025", title: "Great camera, minor delay", body: "Shipping took a day longer than expected but the camera is fantastic. No complaints on the product itself.", verified: true },
    ],
  },
  {
    id: 4,
    title: "Levi's Classic Denim Jacket",
    price: 45,
    originalPrice: 75,
    discount: 40,
    category: "Clothing",
    description:
      "Vintage-washed Levi's denim jacket. Nicely broken in with a classic fade — not distressed or torn. No stains, odor-free. A wardrobe staple you'll reach for every day.",
    location: "Eastside",
    imageUrl: "https://picsum.photos/seed/4/800/600",
    images: [
      "https://picsum.photos/seed/4/800/600",
      "https://picsum.photos/seed/4a/800/600",
      "https://picsum.photos/seed/4b/800/600",
    ],
    rating: 4.5,
    reviewCount: 56,
    sold: 18,
    inStock: true,
    stockCount: 3,
    freeShipping: true,
    shippingDays: 3,
    sellerName: "Emma W.",
    sellerRating: 4.5,
    isVerifiedSeller: false,
    badge: "Hot Deal",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Indigo Blue", "Light Wash"],
    reviews: [
      { id: 1, author: "Sofia M.", avatar: "https://picsum.photos/seed/r9/40/40", rating: 5, date: "Apr 30, 2025", title: "Perfect vintage feel", body: "Exactly the fade I was looking for. Fits true to size. Super fast shipping!", verified: true },
      { id: 2, author: "Raj P.", avatar: "https://picsum.photos/seed/r10/40/40", rating: 4, date: "Mar 22, 2025", title: "Love it", body: "Looks great and feels durable. Sizing is slightly small so size up if between sizes.", verified: false },
    ],
  },
  {
    id: 5,
    title: "Sci-Fi Classics Collection (10 Books)",
    price: 20,
    originalPrice: 45,
    discount: 56,
    category: "Books",
    description:
      "Curated collection of 10 paperback sci-fi novels including Asimov's Foundation series, Dune, Ender's Game, and more. All in good-to-great reading condition. Perfect for a winter deep-dive.",
    location: "Downtown",
    imageUrl: "https://picsum.photos/seed/5/800/600",
    images: [
      "https://picsum.photos/seed/5/800/600",
      "https://picsum.photos/seed/5a/800/600",
      "https://picsum.photos/seed/5b/800/600",
    ],
    rating: 4.9,
    reviewCount: 77,
    sold: 31,
    inStock: true,
    stockCount: 1,
    freeShipping: true,
    shippingDays: 4,
    sellerName: "Bookworm Bob",
    sellerRating: 4.9,
    isVerifiedSeller: true,
    reviews: [
      { id: 1, author: "Alex T.", avatar: "https://picsum.photos/seed/r11/40/40", rating: 5, date: "May 1, 2025", title: "Amazing value", body: "10 great books for $20? Unbeatable. All arrived in great shape, wrapped carefully.", verified: true },
    ],
  },
  {
    id: 6,
    title: "Handmade Ceramic Mug Set (4 pcs)",
    price: 60,
    originalPrice: 85,
    discount: 29,
    category: "Other",
    description:
      "Artisan-crafted ceramic mugs with a beautiful speckled glaze. Each piece is unique. Microwave and dishwasher safe. Supports a local ceramicist. Makes a perfect gift.",
    location: "Arts District",
    imageUrl: "https://picsum.photos/seed/6/800/600",
    images: [
      "https://picsum.photos/seed/6/800/600",
      "https://picsum.photos/seed/6a/800/600",
      "https://picsum.photos/seed/6b/800/600",
    ],
    rating: 4.7,
    reviewCount: 148,
    sold: 52,
    inStock: true,
    stockCount: 5,
    freeShipping: true,
    shippingDays: 3,
    sellerName: "Clay & Co.",
    sellerRating: 4.7,
    isVerifiedSeller: true,
    badge: "Best Seller",
    colors: ["Speckled White", "Terracotta", "Sage Green"],
    reviews: [
      { id: 1, author: "Lily R.", avatar: "https://picsum.photos/seed/r12/40/40", rating: 5, date: "May 5, 2025", title: "Gift-worthy quality", body: "Bought as a gift and everyone was so impressed. The glaze is stunning in person.", verified: true },
      { id: 2, author: "Owen S.", avatar: "https://picsum.photos/seed/r13/40/40", rating: 5, date: "Apr 10, 2025", title: "Beautifully made", body: "Each mug has subtle differences that make them feel truly handmade. Love them.", verified: true },
    ],
  },
  {
    id: 7,
    title: "7'0 Funboard Surfboard",
    price: 200,
    originalPrice: 320,
    discount: 38,
    category: "Sports",
    description:
      "A great beginner-to-intermediate board. A couple of professionally repaired dings — completely water-tight and surf-ready. Great volume for learning to pop up.",
    location: "Beachside",
    imageUrl: "https://picsum.photos/seed/7/800/600",
    images: [
      "https://picsum.photos/seed/7/800/600",
      "https://picsum.photos/seed/7a/800/600",
      "https://picsum.photos/seed/7b/800/600",
    ],
    rating: 4.3,
    reviewCount: 34,
    sold: 12,
    inStock: true,
    stockCount: 1,
    freeShipping: false,
    shippingDays: 7,
    sellerName: "Ocean Joe",
    sellerRating: 4.1,
    isVerifiedSeller: false,
    reviews: [
      { id: 1, author: "Jake M.", avatar: "https://picsum.photos/seed/r14/40/40", rating: 4, date: "Apr 3, 2025", title: "Solid beginner board", body: "Repairs are solid and nearly invisible. Board floats great and was perfect for learning.", verified: true },
    ],
  },
  {
    id: 8,
    title: "Mid-Century Modern Armchair",
    price: 180,
    originalPrice: 260,
    discount: 31,
    category: "Furniture",
    description:
      "Teak frame armchair with original mustard yellow upholstery. A striking mid-century piece that anchors any living room. No tears, springs intact, minimal wear.",
    location: "Uptown",
    imageUrl: "https://picsum.photos/seed/8/800/600",
    images: [
      "https://picsum.photos/seed/8/800/600",
      "https://picsum.photos/seed/8a/800/600",
      "https://picsum.photos/seed/8b/800/600",
      "https://picsum.photos/seed/8c/800/600",
    ],
    rating: 4.9,
    reviewCount: 91,
    sold: 29,
    inStock: true,
    stockCount: 1,
    freeShipping: true,
    shippingDays: 4,
    sellerName: "Vintage Finds",
    sellerRating: 4.9,
    isVerifiedSeller: true,
    badge: "Best Seller",
    colors: ["Mustard Yellow", "Teal", "Charcoal"],
    reviews: [
      { id: 1, author: "Diane F.", avatar: "https://picsum.photos/seed/r15/40/40", rating: 5, date: "May 7, 2025", title: "Statement piece!", body: "This chair is the focal point of my whole living room now. The teak frame is incredibly solid.", verified: true },
      { id: 2, author: "Ben A.", avatar: "https://picsum.photos/seed/r16/40/40", rating: 5, date: "Apr 18, 2025", title: "Exactly as described", body: "Springs are in great shape, cushion is firm and supportive. Very satisfied.", verified: true },
    ],
  },
  {
    id: 9,
    title: "Apple AirPods Pro (2nd Gen)",
    price: 120,
    originalPrice: 189,
    discount: 37,
    category: "Electronics",
    description:
      "Thoroughly cleaned and tested. Excellent ANC performance. Comes with charging case (MagSafe), all silicone tip sizes, and Lightning cable. Battery life is near-original.",
    location: "University Area",
    imageUrl: "https://picsum.photos/seed/9/800/600",
    images: [
      "https://picsum.photos/seed/9/800/600",
      "https://picsum.photos/seed/9a/800/600",
      "https://picsum.photos/seed/9b/800/600",
    ],
    rating: 4.4,
    reviewCount: 167,
    sold: 54,
    inStock: true,
    stockCount: 2,
    freeShipping: true,
    shippingDays: 2,
    sellerName: "Student Sal",
    sellerRating: 4.0,
    isVerifiedSeller: false,
    badge: "Hot Deal",
    colors: ["White"],
    reviews: [
      { id: 1, author: "Priya K.", avatar: "https://picsum.photos/seed/r17/40/40", rating: 4, date: "May 3, 2025", title: "Great deal", body: "ANC works as expected, sound quality is excellent. Case has a minor scuff but earbuds are pristine.", verified: true },
      { id: 2, author: "Luke D.", avatar: "https://picsum.photos/seed/r18/40/40", rating: 5, date: "Mar 30, 2025", title: "Fast shipping, perfect item", body: "Listed as good condition and they delivered. Arrived in 2 days. Highly recommended.", verified: true },
    ],
  },
  {
    id: 10,
    title: "2010 Honda Civic – Manual Transmission",
    price: 4500,
    originalPrice: 5800,
    discount: 22,
    category: "Vehicles",
    description:
      "Reliable daily driver with 120k miles. Recently serviced: oil change, new brake pads, fresh tires. Manual 5-speed, clean title, no accidents on Carfax. Great on gas.",
    location: "Suburbs",
    imageUrl: "https://picsum.photos/seed/10/800/600",
    images: [
      "https://picsum.photos/seed/10/800/600",
      "https://picsum.photos/seed/10a/800/600",
      "https://picsum.photos/seed/10b/800/600",
      "https://picsum.photos/seed/10c/800/600",
    ],
    rating: 4.6,
    reviewCount: 45,
    sold: 1,
    inStock: true,
    stockCount: 1,
    freeShipping: false,
    shippingDays: 7,
    sellerName: "Honest Auto",
    sellerRating: 4.6,
    isVerifiedSeller: true,
    colors: ["Silver", "Black", "White"],
    reviews: [
      { id: 1, author: "Carlos M.", avatar: "https://picsum.photos/seed/r19/40/40", rating: 5, date: "Apr 25, 2025", title: "Exactly as advertised", body: "Carfax clean, runs strong. Honest Auto was transparent and helpful throughout the process.", verified: true },
    ],
  },
  {
    id: 11,
    title: "Merino Wool Winter Coat",
    price: 80,
    originalPrice: 150,
    discount: 47,
    category: "Clothing",
    description:
      "Charcoal gray merino wool blend coat, size Large. Worn only a few times last season. No pilling, no stains — still looks new. Incredibly warm and versatile.",
    location: "Downtown",
    imageUrl: "https://picsum.photos/seed/11/800/600",
    images: [
      "https://picsum.photos/seed/11/800/600",
      "https://picsum.photos/seed/11a/800/600",
      "https://picsum.photos/seed/11b/800/600",
    ],
    rating: 4.8,
    reviewCount: 62,
    sold: 20,
    inStock: true,
    stockCount: 2,
    freeShipping: true,
    shippingDays: 3,
    sellerName: "Sarah Jenkins",
    sellerRating: 4.8,
    isVerifiedSeller: true,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Charcoal", "Camel", "Navy"],
    reviews: [
      { id: 1, author: "Hannah B.", avatar: "https://picsum.photos/seed/r20/40/40", rating: 5, date: "May 6, 2025", title: "Warm and chic", body: "This coat is stunning and incredibly warm. Packaged perfectly, arrived quickly. Great seller!", verified: true },
    ],
  },
  {
    id: 12,
    title: "Yamaha FG800 Acoustic Guitar",
    price: 130,
    originalPrice: 200,
    discount: 35,
    category: "Other",
    description:
      "Yamaha FG800 acoustic in excellent condition. Great sound projection, stays in tune. Includes a padded soft gig bag and a new set of strings still in the pack.",
    location: "Westside",
    imageUrl: "https://picsum.photos/seed/12/800/600",
    images: [
      "https://picsum.photos/seed/12/800/600",
      "https://picsum.photos/seed/12a/800/600",
      "https://picsum.photos/seed/12b/800/600",
    ],
    rating: 4.5,
    reviewCount: 88,
    sold: 27,
    inStock: true,
    stockCount: 1,
    freeShipping: false,
    shippingDays: 5,
    sellerName: "Music Maker",
    sellerRating: 4.3,
    isVerifiedSeller: false,
    badge: "Hot Deal",
    colors: ["Natural"],
    reviews: [
      { id: 1, author: "Sam G.", avatar: "https://picsum.photos/seed/r21/40/40", rating: 5, date: "Apr 22, 2025", title: "Perfect beginner guitar", body: "Sounds great out of the box. The gig bag is a nice bonus. Fast shipping and well-packaged.", verified: true },
      { id: 2, author: "Rina O.", avatar: "https://picsum.photos/seed/r22/40/40", rating: 4, date: "Mar 15, 2025", title: "Good guitar, minor fret buzz", body: "Slight fret buzz on the low E string at the 3rd fret but a simple truss rod adjustment fixed it. Nice instrument overall.", verified: false },
    ],
  },
];

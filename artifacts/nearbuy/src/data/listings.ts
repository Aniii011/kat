export interface Listing {
  id: number;
  title: string;
  price: number;
  category: string;
  description: string;
  location: string;
  postedDate: string;
  imageUrl: string;
  isVerifiedSeller: boolean;
  sellerName: string;
  sellerRating: number;
}

export const listings: Listing[] = [
  {
    id: 1,
    title: "Vintage Wooden Dining Table",
    price: 150,
    category: "Furniture",
    description: "Solid oak dining table from the 1970s. Comfortably seats 6 people. Minor scratches on the surface but overall in great condition. Perfect for a cozy dining room setup.",
    location: "Downtown",
    postedDate: "2 hours ago",
    imageUrl: "https://picsum.photos/seed/1/600/450",
    isVerifiedSeller: true,
    sellerName: "Sarah Jenkins",
    sellerRating: 4.8
  },
  {
    id: 2,
    title: "Mountain Bike - Trek Marlin",
    price: 350,
    category: "Sports",
    description: "Hardly used Trek Marlin mountain bike. 29-inch wheels, 21 speeds. Kept indoors. Great for local trails and commuting.",
    location: "Westside",
    postedDate: "5 hours ago",
    imageUrl: "https://picsum.photos/seed/2/600/450",
    isVerifiedSeller: false,
    sellerName: "Mike R.",
    sellerRating: 4.2
  },
  {
    id: 3,
    title: "Sony A6000 Mirrorless Camera",
    price: 400,
    category: "Electronics",
    description: "Comes with the 16-50mm kit lens, original battery, and charger. Very low shutter count. Selling because I upgraded.",
    location: "North Hills",
    postedDate: "1 day ago",
    imageUrl: "https://picsum.photos/seed/3/600/450",
    isVerifiedSeller: true,
    sellerName: "David Lee",
    sellerRating: 5.0
  },
  {
    id: 4,
    title: "Classic Denim Jacket",
    price: 45,
    category: "Clothing",
    description: "Levi's vintage denim jacket. Size Medium. Nicely faded and broken in. No tears or stains.",
    location: "Eastside",
    postedDate: "1 day ago",
    imageUrl: "https://picsum.photos/seed/4/600/450",
    isVerifiedSeller: false,
    sellerName: "Emma W.",
    sellerRating: 4.5
  },
  {
    id: 5,
    title: "Collection of Sci-Fi Novels",
    price: 20,
    category: "Books",
    description: "10 paperback sci-fi novels including classics from Asimov and Herbert. Good condition, perfect for winter reading.",
    location: "Downtown",
    postedDate: "2 days ago",
    imageUrl: "https://picsum.photos/seed/5/600/450",
    isVerifiedSeller: true,
    sellerName: "Bookworm Bob",
    sellerRating: 4.9
  },
  {
    id: 6,
    title: "Handmade Ceramic Mugs (Set of 4)",
    price: 60,
    category: "Other",
    description: "Beautiful speckled glaze handmade mugs. Microwave and dishwasher safe. Supporting local art!",
    location: "Arts District",
    postedDate: "3 days ago",
    imageUrl: "https://picsum.photos/seed/6/600/450",
    isVerifiedSeller: true,
    sellerName: "Clay & Co.",
    sellerRating: 4.7
  },
  {
    id: 7,
    title: "Used Surfboard - 7'0 Funboard",
    price: 200,
    category: "Sports",
    description: "Great beginner to intermediate board. A couple of professionally repaired dings but water-tight and ready to surf.",
    location: "Beachside",
    postedDate: "3 days ago",
    imageUrl: "https://picsum.photos/seed/7/600/450",
    isVerifiedSeller: false,
    sellerName: "Ocean Joe",
    sellerRating: 4.1
  },
  {
    id: 8,
    title: "Mid-Century Modern Armchair",
    price: 180,
    category: "Furniture",
    description: "Teak frame with mustard yellow upholstery. A classic piece that adds warmth to any living room.",
    location: "Uptown",
    postedDate: "4 days ago",
    imageUrl: "https://picsum.photos/seed/8/600/450",
    isVerifiedSeller: true,
    sellerName: "Vintage Finds",
    sellerRating: 4.9
  },
  {
    id: 9,
    title: "Apple AirPods Pro",
    price: 120,
    category: "Electronics",
    description: "Good condition, thoroughly cleaned. Comes with charging case and a new set of silicone tips.",
    location: "University Area",
    postedDate: "4 days ago",
    imageUrl: "https://picsum.photos/seed/9/600/450",
    isVerifiedSeller: false,
    sellerName: "Student Sal",
    sellerRating: 4.0
  },
  {
    id: 10,
    title: "2010 Honda Civic - Manual",
    price: 4500,
    category: "Vehicles",
    description: "Reliable commuter car. 120k miles. Runs great, recently serviced. Manual transmission.",
    location: "Suburbs",
    postedDate: "5 days ago",
    imageUrl: "https://picsum.photos/seed/10/600/450",
    isVerifiedSeller: true,
    sellerName: "Honest Auto",
    sellerRating: 4.6
  },
  {
    id: 11,
    title: "Winter Wool Coat",
    price: 80,
    category: "Clothing",
    description: "Charcoal gray wool blend coat. Size Large. Worn only a few times last season. Very warm.",
    location: "Downtown",
    postedDate: "6 days ago",
    imageUrl: "https://picsum.photos/seed/11/600/450",
    isVerifiedSeller: true,
    sellerName: "Sarah Jenkins",
    sellerRating: 4.8
  },
  {
    id: 12,
    title: "Acoustic Guitar - Yamaha",
    price: 130,
    category: "Other",
    description: "Yamaha FG800 acoustic guitar. Great sound, stays in tune. Includes soft gig bag.",
    location: "Westside",
    postedDate: "1 week ago",
    imageUrl: "https://picsum.photos/seed/12/600/450",
    isVerifiedSeller: false,
    sellerName: "Music Maker",
    sellerRating: 4.3
  }
];

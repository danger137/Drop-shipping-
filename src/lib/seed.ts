export const IMG = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PHOTO_POOL = [
  "photo-1523275335684-37898b6baf30",
  "photo-1505740420928-5e560c06d30e",
  "photo-1542291026-7eec264c27ff",
  "photo-1526170375885-4d8ecf77b99f",
  "photo-1560769629-975ec94e6a86",
  "photo-1491553895911-0055eca6402d",
  "photo-1572635196237-14b3f281503f",
  "photo-1585386959984-a4155224a1ad",
  "photo-1594223274512-ad4803739b7c",
  "photo-1596462502278-27bfdc403348",
  "photo-1553062407-98eeb64c6a62",
  "photo-1546868871-7041f2a55e12",
  "photo-1602143407151-7111542de6e8",
  "photo-1600185365483-26d7a4cc7519",
  "photo-1556909212-d5b604d0c90d",
  "photo-1513506003901-1e6a229e2d15",
  "photo-1522708323590-d24dbb6b0267",
  "photo-1567401893414-76b7b1e5a7a5",
  "photo-1584917865442-de89df76afd3",
  "photo-1571781926291-c477ebfd024b",
];

export type Category = { id: string; title: string; image: string };
export type Product = {
  id: string;
  title: string;
  description: string;
  wholesale: number;
  suggested: number;
  stock: number;
  categoryId: string;
  images: string[];
  colors: string[];
  sizes: string[];
  hook: string;
  vendorId?: string;
  isActive?: boolean;
  courierWeight?: string;
  isHeavy?: boolean;
  approvalStatus?: "PENDING_ADMIN_APPROVAL" | "APPROVED" | "REJECTED";
  adminNotes?: string;
  subCategory?: string;
  createdAt?: string;
  /** Optional per-variant wholesale price overrides. Key = color/size name, value = wholesale price */
  colorPricing?: Record<string, number>;
  sizePricing?: Record<string, number>;
  /** Optional per-color image. When reseller picks a color, the main image swaps to this. */
  colorImages?: Record<string, string>;
};

export const SEED_CATEGORIES: Category[] = [
  { id: "c1", title: "Men's Fashion", image: IMG("photo-1567401893414-76b7b1e5a7a5") },
  { id: "c2", title: "Ladies Wear", image: IMG("photo-1483985988355-763728e1935b") },
  { id: "c3", title: "Watches & Accessories", image: IMG("photo-1523275335684-37898b6baf30") },
  { id: "c4", title: "Footwear", image: IMG("photo-1542291026-7eec264c27ff") },
  { id: "c5", title: "Gadgets & Electronics", image: IMG("photo-1505740420928-5e560c06d30e") },
  { id: "c6", title: "Beauty & Skincare", image: IMG("photo-1596462502278-27bfdc403348") },
  { id: "c7", title: "Home & Kitchen", image: IMG("photo-1556909212-d5b604d0c90d") },
  { id: "c8", title: "Bags & Luggage", image: IMG("photo-1553062407-98eeb64c6a62") },
];

const NAMES: Record<string, string[]> = {
  c1: ["Premium Cotton Polo", "Winter Fleece Hoodie", "Slim Fit Denim Shirt", "Karkhana Bazaar Kurta"],
  c2: ["Embroidered Lawn Suit", "Chiffon Party Dress", "Printed Kurti", "Silk Dupatta Set"],
  c3: ["Chrono Steel Wristwatch", "Leather Strap Classic", "Digital Sports Watch", "Luxury Gift Watch Box"],
  c4: ["Air Cushion Sneakers", "Peshawari Chappal", "Running Trainers", "Casual Loafers"],
  c5: ["TWS Wireless Earbuds", "Smart Fitness Band", "Bluetooth Speaker", "Fast Charge Power Bank"],
  c6: ["Vitamin C Serum", "Whitening Face Wash", "Matte Lipstick Kit", "Long Lasting Perfume"],
  c7: ["Non-Stick Cookware Set", "LED Ambient Lamp", "Storage Organizer Rack", "Electric Chopper"],
  c8: ["Waterproof Laptop Backpack", "Travel Duffle Bag", "Ladies Hand Bag", "Cabin Trolley"],
};

export function buildProducts(): Product[] {
  const out: Product[] = [];
  let i = 0;
  while (out.length < 100) {
    for (const cat of SEED_CATEGORIES) {
      if (out.length >= 100) break;
      const base = NAMES[cat.id][i % 4];
      const wholesale = 550 + ((i * 137) % 4200);
      const suggested = Math.round((wholesale + 250) * 1.55);
      out.push({
        id: `p${out.length + 1}`,
        title: `${base} ${["Classic", "Pro", "Deluxe", "Edition"][i % 4]}`,
        description:
          "Sourced directly from Faisalabad Karkhana Bazaar. Premium stitching, quality-checked before dispatch, and packed in your own brand packaging. Zero inventory required — we ship, you keep the profit.",
        wholesale,
        suggested,
        stock: 12 + ((i * 7) % 180),
        categoryId: cat.id,
        images: [
          IMG(PHOTO_POOL[(i * 3) % PHOTO_POOL.length]),
          IMG(PHOTO_POOL[(i * 3 + 1) % PHOTO_POOL.length]),
          IMG(PHOTO_POOL[(i * 3 + 2) % PHOTO_POOL.length]),
        ],
        colors: ["Black", "White", "Navy", "Maroon"].slice(0, 2 + (i % 3)),
        sizes: cat.id === "c1" || cat.id === "c2" || cat.id === "c4" ? ["S", "M", "L", "XL"] : ["Standard"],
        hook: "POV: You started selling this and made PKR 1,200 profit on your very first order 🔥",
        vendorId: i % 2 === 0 ? "vendor-1" : "vendor-2",
        isActive: true,
        courierWeight: i % 2 === 0 ? "0.8 kg" : "1.2 kg",
        isHeavy: i % 5 === 0,
        createdAt: new Date().toISOString(),
      });
      i++;
    }
  }
  return out;
}

export const PK_CITIES = [
  "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Islamabad", "Multan", "Gujranwala",
  "Peshawar", "Quetta", "Sialkot", "Bahawalpur", "Sargodha", "Sukkur", "Hyderabad",
  "Abbottabad", "Mardan", "Sahiwal", "Okara", "Gujrat", "Dera Ghazi Khan",
];

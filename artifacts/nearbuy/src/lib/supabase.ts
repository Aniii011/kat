import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      listings: {
        Row: {
          id: number;
          title: string;
          price: number;
          original_price: number | null;
          discount: number | null;
          category: string;
          description: string;
          location: string;
          image_url: string;
          images: string[];
          rating: number;
          review_count: number;
          sold: number;
          in_stock: boolean;
          stock_count: number;
          free_shipping: boolean;
          shipping_days: number;
          seller_name: string;
          seller_rating: number;
          is_verified_seller: boolean;
          badge: string | null;
          colors: string[] | null;
          sizes: string[] | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["listings"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: number;
          listing_id: number;
          author: string;
          avatar: string;
          rating: number;
          date: string;
          title: string;
          body: string;
          verified: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
    };
  };
};

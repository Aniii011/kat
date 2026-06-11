import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft,
  Plus,
  Package,
  ShoppingCart,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Upload,
  Lock,
  LogIn,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

export default function Seller() {
  const { user } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showUpload, setShowUpload] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  // ───────── FETCH PRODUCTS ─────────
  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setProducts(data || []);
      setLoading(false);
    };

    fetchProducts();
  }, [user]);

  // ───────── IMAGE UPLOAD ─────────
  const uploadImage = async () => {
    if (!imageFile) return "";

    const fileName = `${Date.now()}-${imageFile.name}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageFile);

    if (error) {
      console.log(error.message);
      return "";
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // ───────── ADD PRODUCT ─────────
  const addProduct = async () => {
    const imageUrl = await uploadImage();

    const { error } = await supabase.from("products").insert({
      title,
      description,
      price: Number(price),
      seller_id: user?.id,
      image_url: imageUrl,
    });

    if (!error) {
      setShowUpload(false);
      setTitle("");
      setPrice("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
      window.location.reload();
    } else {
      console.log(error.message);
    }
  };

  // ───────── DELETE PRODUCT ─────────
  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // ───────── AUTH GUARDS ─────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <LogIn className="w-10 h-10 mb-2" />
        <p>Sign in required</p>
        <Link href="/">
          <Button className="mt-3">Go Home</Button>
        </Link>
      </div>
    );
  }

  if (!user.sellerVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col text-center p-6">
        <Lock className="w-10 h-10 mb-2 text-amber-500" />
        <h1 className="font-bold text-lg">Seller Access Required</h1>
        <p className="text-sm text-muted-foreground">
          Your account is not approved yet.
        </p>
      </div>
    );
  }

  // ───────── UI ─────────
  return (
    <div className="min-h-screen bg-background p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/me">
          <ArrowLeft />
        </Link>

        <h1 className="font-bold">Seller Dashboard</h1>

        <Button onClick={() => setShowUpload(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 border rounded-xl">
          <Package />
          <p>{products.length} Products</p>
        </div>
        <div className="p-3 border rounded-xl">
          <ShoppingCart />
          <p>0 Orders</p>
        </div>
        <div className="p-3 border rounded-xl">
          <TrendingUp />
          <p>₦0 Revenue</p>
        </div>
        <div className="p-3 border rounded-xl">
          <Eye />
          <p>0 Views</p>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="space-y-3">
        {loading ? (
          <p>Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No products yet. Add your first product.
          </p>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="border rounded-xl p-3 flex gap-3 items-center"
            >
              {p.image_url && (
                <img
                  src={p.image_url}
                  className="w-14 h-14 object-cover rounded-lg"
                />
              )}

              <div className="flex-1">
                <p className="font-semibold">{p.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatNaira(p.price)}
                </p>
              </div>

              <button onClick={() => deleteProduct(p.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* UPLOAD MODAL */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Input
              placeholder="Price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* image upload */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
            />

            {imagePreview && (
              <img
                src={imagePreview}
                className="w-full h-40 object-cover rounded-lg"
              />
            )}

            <Button onClick={addProduct} className="w-full">
              Save Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

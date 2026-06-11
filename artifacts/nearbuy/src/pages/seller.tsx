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
  Trash2,
  Lock,
  LogIn,
  AlertCircle,
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
  const [ordersCount, setOrdersCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [views, setViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      setLoading(true);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (!productsError) setProducts(productsData || []);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", user.id);

      if (!ordersError && ordersData) {
        setOrdersCount(ordersData.length);
        const totalRevenue = ordersData.reduce(
          (sum, order) => sum + (order.total || 0), 0
        );
        setRevenue(totalRevenue);
      }

      const { data: viewsData, error: viewsError } = await supabase
        .from("product_views")
        .select("*")
        .in("product_id", (productsData || []).map((p) => p.id));

      if (!viewsError && viewsData) setViews(viewsData.length);

      setLoading(false);
    };

    fetchProducts();
  }, [user]);

  const uploadImage = async () => {
    if (!imageFile) return "";
    const fileName = `${Date.now()}-${imageFile.name}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageFile);
    if (error) return "";
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const addProduct = async () => {
    if (!title.trim() || !price) {
      setUploadError("Please fill in title and price.");
      return;
    }
    setUploading(true);
    setUploadError(null);

    const imageUrl = await uploadImage();

    const { data, error } = await supabase
      .from("products")
      .insert({
        title,
        description,
        price: Number(price),
        seller_id: user?.id,
        image_url: imageUrl,
      })
      .select()
      .single();

    setUploading(false);

    if (!error && data) {
      setProducts((prev) => [data, ...prev]);
      setShowUpload(false);
      setTitle("");
      setPrice("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
    } else {
      setUploadError(error?.message || "Failed to add product.");
    }
  };

  const deleteProduct = async (id: string) => {
    const confirm = window.confirm("Are you sure you want to delete this product?");
    if (!confirm) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3 p-6">
        <LogIn className="w-10 h-10 text-muted-foreground" />
        <p className="font-semibold">Sign in required</p>
        <Link href="/">
          <Button className="rounded-full">Go Home</Button>
        </Link>
      </div>
    );
  }

  if (!user.sellerVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col text-center p-6 gap-3">
        <Lock className="w-10 h-10 text-amber-500" />
        <h1 className="font-bold text-lg">Seller Access Required</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Hi {user.name}, your account is not yet approved as a verified KAT seller.
          Seller accounts are created and approved by KAT admins. Contact us at{" "}
          <span className="text-primary font-semibold">sellers@kat.com</span> to apply.
        </p>
        <Link href="/">
          <Button variant="outline" className="rounded-full mt-2">Go Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/me">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="font-black text-base">Seller Dashboard</h1>
          <Button
            onClick={() => setShowUpload(true)}
            className="rounded-full h-9 gap-1 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: <Package className="w-5 h-5 text-primary" />, label: "Products", value: products.length },
            { icon: <ShoppingCart className="w-5 h-5 text-primary" />, label: "Orders", value: ordersCount },
            { icon: <TrendingUp className="w-5 h-5 text-primary" />, label: "Revenue", value: formatNaira(revenue) },
            { icon: <Eye className="w-5 h-5 text-primary" />, label: "Views", value: views },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-card-border rounded-2xl p-4 flex flex-col gap-2">
              {stat.icon}
              <p className="text-lg font-black text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Products */}
        <h2 className="font-bold text-sm mb-3">My Products</h2>
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-sm">No products yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first product to get started</p>
              <Button
                onClick={() => setShowUpload(true)}
                className="rounded-full mt-4 text-xs"
                size="sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
              </Button>
            </div>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-center"
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.title}
                    className="w-16 h-16 object-cover rounded-xl shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.title}</p>
                  <p className="text-xs text-primary font-bold mt-0.5">
                    {formatNaira(p.price)}
                  </p>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {p.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-black">Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Product title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl h-11"
            />
            <Input
              placeholder="Price (₦)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-xl h-11"
            />
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Product Image
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs"
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
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-xl"
                />
              )}
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {uploadError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => {
                  setShowUpload(false);
                  setUploadError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full"
                onClick={addProduct}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Add Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

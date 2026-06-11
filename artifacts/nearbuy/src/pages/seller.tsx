import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft, Plus, Package, ShoppingCart, TrendingUp, Eye,
  Trash2, Lock, LogIn, AlertCircle, X, ImagePlus, Video,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

const COLORS = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Brown", "Grey", "Orange", "Beige"];
const CLOTHING_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];

interface Variant {
  id: string;
  color?: string;
  size?: string;
  shoeSize?: string;
  price?: string;
  stock?: string;
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
  const [basePrice, setBasePrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [useVariantPricing, setUseVariantPricing] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedShoeSizes, setSelectedShoeSizes] = useState<string[]>([]);

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
        setRevenue(ordersData.reduce((sum, o) => sum + (o.total || 0), 0));
      }

      const { data: viewsData } = await supabase
        .from("product_views")
        .select("*")
        .in("product_id", (productsData || []).map((p) => p.id));

      if (viewsData) setViews(viewsData.length);
      setLoading(false);
    };

    fetchProducts();
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 8 - imageFiles.length;
    const newFiles = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const fileName = `${Date.now()}-${Math.random()}-${file.name}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, file);
      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const uploadVideo = async (): Promise<string> => {
    if (!videoFile) return "";
    const fileName = `videos/${Date.now()}-${videoFile.name}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, videoFile);
    if (error) return "";
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const generateVariants = () => {
    const newVariants: Variant[] = [];
    const colors = selectedColors.length > 0 ? selectedColors : [undefined];
    const sizes = selectedSizes.length > 0 ? selectedSizes : [undefined];
    const shoeSizes = selectedShoeSizes.length > 0 ? selectedShoeSizes : [undefined];

    for (const color of colors) {
      for (const size of sizes) {
        for (const shoeSize of shoeSizes) {
          if (color || size || shoeSize) {
            newVariants.push({
              id: Math.random().toString(36).slice(2),
              color,
              size,
              shoeSize,
              price: basePrice,
              stock: "10",
            });
          }
        }
      }
    }
    setVariants(newVariants);
  };

  const updateVariant = (id: string, field: keyof Variant, value: string) => {
    setVariants((prev) => prev.map((v) => v.id === id ? { ...v, [field]: value } : v));
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleShoeSize = (size: string) => {
    setSelectedShoeSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const resetForm = () => {
    setTitle(""); setBasePrice(""); setDescription("");
    setImageFiles([]); setImagePreviews([]);
    setVideoFile(null); setVideoPreview("");
    setVariants([]); setSelectedColors([]);
    setSelectedSizes([]); setSelectedShoeSizes([]);
    setUseVariantPricing(false); setShowVariants(false);
    setUploadError(null);
  };

  const addProduct = async () => {
    if (!title.trim() || !basePrice) {
      setUploadError("Please fill in title and price.");
      return;
    }
    if (imageFiles.length === 0) {
      setUploadError("Please add at least one image.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const imageUrls = await uploadImages();
    const videoUrl = await uploadVideo();

    const { data, error } = await supabase
      .from("products")
      .insert({
        title,
        description,
        price: Number(basePrice),
        seller_id: user?.id,
        image_url: imageUrls[0] || "",
        images: imageUrls,
        video_url: videoUrl || null,
        variants: variants.length > 0 ? variants : null,
        use_variant_pricing: useVariantPricing,
      })
      .select()
      .single();

    setUploading(false);

    if (!error && data) {
      setProducts((prev) => [data, ...prev]);
      setShowUpload(false);
      resetForm();
    } else {
      setUploadError(error?.message || "Failed to add product.");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3 p-6">
        <LogIn className="w-10 h-10 text-muted-foreground" />
        <p className="font-semibold">Sign in required</p>
        <Link href="/"><Button className="rounded-full">Go Home</Button></Link>
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
          Contact us at <span className="text-primary font-semibold">sellers@kat.com</span> to apply.
        </p>
        <Link href="/"><Button variant="outline" className="rounded-full mt-2">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 py-4">

        <div className="flex items-center justify-between mb-6">
          <Link href="/me">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="font-black text-base">Seller Dashboard</h1>
          <Button onClick={() => setShowUpload(true)} className="rounded-full h-9 gap-1 text-xs font-semibold">
            <Plus className="w-3.5 h-3.5" /> Add Product
          </Button>
        </div>

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

        <h2 className="font-bold text-sm mb-3">My Products</h2>
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-sm">No products yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first product to get started</p>
              <Button onClick={() => setShowUpload(true)} className="rounded-full mt-4 text-xs" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
              </Button>
            </div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-center">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-16 h-16 object-cover rounded-xl shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.title}</p>
                  <p className="text-xs text-primary font-bold mt-0.5">{formatNaira(p.price)}</p>
                  {p.variants && p.variants.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {p.variants.length} variant{p.variants.length > 1 ? "s" : ""}
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

      <Dialog open={showUpload} onOpenChange={(open) => { if (!open) resetForm(); setShowUpload(open); }}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black">Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">

            <Input
              placeholder="Product title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl h-11"
            />

            <Input
              placeholder="Base price (₦) *"
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="rounded-xl h-11"
            />

            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />

            {/* Images */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">
                  Images ({imageFiles.length}/8) *
                </p>
                {imageFiles.length < 8 && (
                  <label className="flex items-center gap-1 text-xs text-primary font-semibold cursor-pointer">
                    <ImagePlus className="w-3.5 h-3.5" /> Add Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={preview} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 text-white px-1 rounded">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {imagePreviews.length === 0 && (
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Tap to add images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>

            {/* Video */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Product Video (optional)</p>
              {videoPreview ? (
                <div className="relative">
                  <video src={videoPreview} className="w-full rounded-xl" controls />
                  <button
                    type="button"
                    onClick={() => { setVideoFile(null); setVideoPreview(""); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 text-xs text-primary font-semibold cursor-pointer border border-dashed border-border rounded-xl p-3 hover:border-primary/50 transition-colors">
                  <Video className="w-4 h-4" /> Add Video
                  <input type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
                </label>
              )}
            </div>

            {/* Variants */}
            <div className="space-y-3 bg-muted rounded-2xl p-3">
              <button
                type="button"
                onClick={() => setShowVariants(!showVariants)}
                className="w-full flex items-center justify-between text-sm font-semibold"
              >
                <span>Product Variants (optional)</span>
                {showVariants ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showVariants && (
                <div className="space-y-4">

                  {/* Colors */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Colors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => toggleColor(color)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            selectedColors.includes(color)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clothing Sizes */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Clothing Sizes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CLOTHING_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            selectedSizes.includes(size)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shoe Sizes */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Shoe Sizes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SHOE_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleShoeSize(size)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            selectedShoeSizes.includes(size)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Variant pricing toggle */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Different price per variant?</p>
                    <button
                      type="button"
                      onClick={() => setUseVariantPricing(!useVariantPricing)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        useVariantPricing ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${
                        useVariantPricing ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Generate variants button */}
                  {(selectedColors.length > 0 || selectedSizes.length > 0 || selectedShoeSizes.length > 0) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full text-xs"
                      onClick={generateVariants}
                    >
                      Generate {variants.length > 0 ? "& Update" : ""} Variants
                    </Button>
                  )}

                  {/* Variant list */}
                  {variants.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {variants.length} Variant{variants.length > 1 ? "s" : ""}
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {variants.map((v) => (
                          <div key={v.id} className="bg-background rounded-xl p-2.5 space-y-2">
                            <p className="text-xs font-semibold">
                              {[v.color, v.size, v.shoeSize].filter(Boolean).join(" / ")}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {useVariantPricing && (
                                <Input
                                  placeholder="Price (₦)"
                                  type="number"
                                  value={v.price || ""}
                                  onChange={(e) => updateVariant(v.id, "price", e.target.value)}
                                  className="rounded-lg h-8 text-xs"
                                />
                              )}
                              <Input
                                placeholder="Stock qty"
                                type="number"
                                value={v.stock || ""}
                                onChange={(e) => updateVariant(v.id, "stock", e.target.value)}
                                className="rounded-lg h-8 text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                onClick={() => { setShowUpload(false); resetForm(); }}
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

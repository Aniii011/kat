import React, { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import {
  Home, Package, ShoppingCart, Megaphone, FileText, Settings,
  LogIn, Lock, Plus, Bell, ChevronRight, AlertCircle, Star,
  Truck, Clock, CheckCircle2, XCircle, RefreshCw, DollarSign,
  Pencil, Trash2, X, ImagePlus, Video, ChevronDown, ChevronUp,
  StickyNote, ArrowLeft, BarChart2, Store, BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

type SellerSection = "home" | "products" | "orders" | "promotions" | "statements" | "settings";

const CATEGORIES = ["Women", "Men", "Kids", "Shoes", "Jewelry & Accessories", "Beauty & Health", "Gym & Outdoor", "Phone & Accessories", "Home", "Thrift"];

const AESTHETICS = ["Y2K", "Streetwear", "Afrocentric", "Minimalist", "Baddie", "Cottagecore", "Techwear", "Boho", "Preppy", "Grunge", "Luxe", "Casual"];

const COLORS = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Brown", "Grey", "Orange", "Beige"];

const CLOTHING_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];

const AUDIENCES = ["Women", "Men", "Girls", "Boys", "Babies", "Teens", "Unisex"];
const FITS = ["Slim", "Regular", "Loose", "Oversized"];
const LENGTHS = ["Short", "Midi", "Long"];
const MATERIALS = ["Cotton", "Linen", "Denim", "Polyester", "Silk", "Wool", "Leather", "Chiffon", "Ankara", "Lace"];
const OCCASIONS = ["Casual", "Formal", "Party", "Office", "Sports", "Beach", "Wedding", "Everyday"];

const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];

const THRIFT_CONDITIONS = [
  { value: "new", label: "New", desc: "Never worn, with tags" },
  { value: "like_new", label: "Like New", desc: "Worn once or twice, no flaws" },
  { value: "good", label: "Good", desc: "Minor signs of wear" },
  { value: "fair", label: "Fair", desc: "Visible wear, still functional" },
];

const PACKAGE_SIZES = [
  { value: "small", label: "Small", desc: "0–5kg · 60×40×20cm", example: "Phones, shirts, books" },
  { value: "medium", label: "Medium", desc: "5–15kg · 80×60×40cm", example: "Shoes, laptops, blenders" },
  { value: "large", label: "Large", desc: "15–35kg · 140×80×60cm", example: "Microwaves, bulk items" },
];

// Sellers can only move an order through the steps they actually control.
// Once it's ready for pickup, admin/logistics takes over (out_for_delivery → delivered → completed).
const SELLER_CONTROLLED_STATUSES = ["accepted", "preparing", "ready_for_pickup"];

const ORDER_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:          { label: "Pending",          className: "bg-amber-100 text-amber-700" },
  accepted:         { label: "Accepted",         className: "bg-sky-100 text-sky-700" },
  preparing:        { label: "Preparing",        className: "bg-blue-100 text-blue-700" },
  ready_for_pickup: { label: "Ready for Pickup", className: "bg-purple-100 text-purple-700" },
  out_for_delivery: { label: "Out for Delivery", className: "bg-orange-100 text-orange-700" },
  delivered:        { label: "Delivered",        className: "bg-emerald-100 text-emerald-700" },
  completed:        { label: "Completed",        className: "bg-green-100 text-green-700" },
  cancelled:        { label: "Cancelled",        className: "bg-red-100 text-red-700" },
};

const NAV_ITEMS: { key: SellerSection; label: string; icon: React.ReactNode }[] = [
  { key: "home",       label: "Dashboard",          icon: <Home className="w-4 h-4" /> },
  { key: "products",   label: "Products",           icon: <Package className="w-4 h-4" /> },
  { key: "orders",     label: "Orders",             icon: <ShoppingCart className="w-4 h-4" /> },
  { key: "promotions", label: "Promotions",         icon: <Megaphone className="w-4 h-4" /> },
  { key: "statements", label: "Statements",         icon: <FileText className="w-4 h-4" /> },
  { key: "settings",   label: "Settings",           icon: <Settings className="w-4 h-4" /> },
];

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
  const [section, setSection] = useState<SellerSection>("home");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  // Upload form state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedAesthetics, setSelectedAesthetics] = useState<string[]>([]);
  const [audience, setAudience] = useState("");
  const [fit, setFit] = useState("");
  const [length, setLength] = useState("");
  const [material, setMaterial] = useState("");
  const [occasion, setOccasion] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState("");
  const [isThrift, setIsThrift] = useState(false);
  const [thriftCondition, setThriftCondition] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [packageSize, setPackageSize] = useState("");
  const [sellerNote, setSellerNote] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [existingVideoUrl, setExistingVideoUrl] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [useVariantPricing, setUseVariantPricing] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedShoeSizes, setSelectedShoeSizes] = useState<string[]>([]);
  const [colorImageFiles, setColorImageFiles] = useState<Record<string, File>>({});
  const [colorImagePreviews, setColorImagePreviews] = useState<Record<string, string>>({});
  const [existingColorImages, setExistingColorImages] = useState<Record<string, string>>({});
  const [customSizeNote, setCustomSizeNote] = useState("");
  const [stockCount, setStockCount] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data: productsData } = await supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
    if (productsData) setProducts(productsData);
    const { data: ordersData } = await supabase.from("orders").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
    if (ordersData) setOrders(ordersData);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // Real-time order updates
    const channel = supabase.channel("seller-orders-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `seller_id=eq.${user?.id}` }, (payload) => {
        setOrders((prev) => [payload.new as any, ...prev]);
        setNewOrderAlert(true);
        setTimeout(() => setNewOrderAlert(false), 5000);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `seller_id=eq.${user?.id}` }, (payload) => {
        setOrders((prev) => prev.map((o) => o.id === (payload.new as any).id ? payload.new as any : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

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
          Your account is not yet approved as a verified KAT seller.
          Contact <span className="text-primary font-semibold">sellers@kat.com</span> to apply.
        </p>
        <Link href="/"><Button variant="outline" className="rounded-full mt-2">Go Home</Button></Link>
      </div>
    );
  }

  const revenue = orders.reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const pendingOrders = orders.filter((o) => (o.admin_status || "pending") === "pending");
  const toShip = orders.filter((o) => o.admin_status === "preparing" || o.admin_status === "accepted");
  const incompleteProducts = products.filter((p) => !p.title || !p.price || !p.image_url);

  const resetForm = () => {
    setEditingProductId(null); setTitle(""); setBasePrice(""); setDescription("");
    setCategory(""); setSelectedAesthetics([]); setIsThrift(false); setThriftCondition("");
    setDepositAmount(""); setPackageSize(""); setSellerNote(""); setStockCount("");
    setAudience(""); setFit(""); setLength(""); setMaterial(""); setOccasion(""); setAiError("");
    setImageFiles([]); setImagePreviews([]); setExistingImages([]);
    setVideoFile(null); setVideoPreview(""); setExistingVideoUrl("");
    setVariants([]); setSelectedColors([]); setSelectedSizes([]); setSelectedShoeSizes([]);
    setUseVariantPricing(false); setShowVariants(false);
    setColorImageFiles({}); setColorImagePreviews({}); setExistingColorImages({});
    setCustomSizeNote(""); setUploadError(null);
  };

  const openEdit = (p: any) => {
    setEditingProductId(p.id);
    setTitle(p.title || ""); setBasePrice(String(p.seller_price ?? p.price ?? "")); setDescription(p.description || "");
    setCategory(p.category || ""); setSelectedAesthetics(p.aesthetics || []);
    setAudience(p.audience || ""); setFit(p.fit || ""); setLength(p.length || "");
    setMaterial(p.material || ""); setOccasion(p.occasion || "");
    setIsThrift(Boolean(p.is_thrift)); setThriftCondition(p.thrift_condition || "");
    setDepositAmount(String(p.deposit_amount ?? "")); setPackageSize(p.package_size || "");
    setSellerNote(p.seller_note || ""); setStockCount(String(p.stock_count ?? ""));
    setExistingImages(Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []));
    setImageFiles([]); setImagePreviews([]);
    setExistingVideoUrl(p.video_url || ""); setVideoFile(null); setVideoPreview("");
    const v: Variant[] = Array.isArray(p.variants) ? p.variants : [];
    setVariants(v); setUseVariantPricing(Boolean(p.use_variant_pricing)); setShowVariants(v.length > 0);
    setSelectedColors(Array.from(new Set(v.map((x: any) => x.color).filter(Boolean))) as string[]);
    setSelectedSizes(Array.from(new Set(v.map((x: any) => x.size).filter(Boolean))) as string[]);
    setSelectedShoeSizes(Array.from(new Set(v.map((x: any) => x.shoeSize).filter(Boolean))) as string[]);
    setCustomSizeNote(p.custom_size_note || "");
    setExistingColorImages(p.color_images || {});
    setColorImageFiles({}); setColorImagePreviews({});
    setUploadError(null);
    setShowUpload(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 8 - (imageFiles.length + existingImages.length);
    const newFiles = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  };

  const handleColorImageSelect = (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setColorImageFiles((prev) => ({ ...prev, [color]: file }));
    setColorImagePreviews((prev) => ({ ...prev, [color]: URL.createObjectURL(file) }));
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

  const uploadColorImages = async (): Promise<Record<string, string>> => {
    const result: Record<string, string> = { ...existingColorImages };
    for (const [color, file] of Object.entries(colorImageFiles)) {
      const fileName = `colors/${Date.now()}-${Math.random()}-${file.name}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, file);
      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
        result[color] = data.publicUrl;
      }
    }
    return result;
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
            const existing = variants.find((v) => v.color === color && v.size === size && v.shoeSize === shoeSize);
            newVariants.push(existing || { id: Math.random().toString(36).slice(2), color, size, shoeSize, price: basePrice, stock: "10" });
          }
        }
      }
    }
    setVariants(newVariants);
  };

  const updateVariant = (id: string, field: keyof Variant, value: string) => {
    setVariants((prev) => prev.map((v) => v.id === id ? { ...v, [field]: value } : v));
  };

  const generateWithAI = async () => {
    if (!title.trim()) { setAiError("Type a rough product name first (e.g. \"black dress\")."); return; }
    setGeneratingAI(true);
    setAiError("");
    try {
      const res = await fetch("/api/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roughName: title,
          category, audience, fit, length, material, occasion,
          colors: selectedColors,
          aesthetics: selectedAesthetics,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "AI generation failed, please try again.");
        setGeneratingAI(false);
        return;
      }
      setTitle(data.title);
      setDescription(data.description);
    } catch (err: any) {
      setAiError(err.message || "AI generation failed, please try again.");
    }
    setGeneratingAI(false);
  };

  const saveProduct = async () => {
    if (!title.trim() || !basePrice) { setUploadError("Please fill in title and price."); return; }
    if (existingImages.length + imageFiles.length === 0) { setUploadError("Please add at least one image."); return; }
    if (!category) { setUploadError("Please select a category."); return; }

    setUploading(true); setUploadError(null);

    const newImageUrls = await uploadImages();
    const allImages = [...existingImages, ...newImageUrls];
    let videoUrl = existingVideoUrl;
    if (videoFile) videoUrl = await uploadVideo();
    const colorImages = await uploadColorImages();

    const payload = {
      title, description, category,
      aesthetics: selectedAesthetics.length > 0 ? selectedAesthetics : null,
      audience: audience || null,
      fit: fit || null,
      length: length || null,
      material: material || null,
      occasion: occasion || null,
      seller_price: Number(basePrice),
      price: Math.round(Number(basePrice) * 1.095),
      image_url: allImages[0] || "",
      images: allImages,
      video_url: videoUrl || null,
      variants: variants.length > 0 ? variants : null,
      use_variant_pricing: useVariantPricing,
      custom_size_note: customSizeNote.trim() || null,
      color_images: Object.keys(colorImages).length > 0 ? colorImages : null,
      is_thrift: isThrift,
      thrift_condition: isThrift && thriftCondition ? thriftCondition : null,
      deposit_amount: isThrift && depositAmount ? Number(depositAmount) : null,
      package_size: packageSize || null,
      seller_note: sellerNote.trim() || null,
      stock_count: stockCount ? Number(stockCount) : null,
      in_stock: true,
      seller_id: user.id,
      seller_name: user.name || user.email,
    };

    if (editingProductId) {
      const { data, error } = await supabase.from("products").update(payload).eq("id", editingProductId).select().single();
      setUploading(false);
      if (!error && data) { setProducts((prev) => prev.map((p) => p.id === editingProductId ? data : p)); setShowUpload(false); resetForm(); }
      else { setUploadError(error?.message || "Failed to update."); }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().single();
      setUploading(false);
      if (!error && data) { setProducts((prev) => [data, ...prev]); setShowUpload(false); resetForm(); }
      else { setUploadError(error?.message || "Failed to save."); }
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ admin_status: status, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) {
      console.error("SELLER STATUS UPDATE FAILED:", error);
      alert("Couldn't update order status: " + error.message);
      return;
    }
    await supabase.from("order_events").insert({ order_id: orderId, status });
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, admin_status: status } : o));
  };

  const totalImages = existingImages.length + imageFiles.length;

  // ── ADD/EDIT PRODUCT FULL PAGE ──
  if (showUpload) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => { setShowUpload(false); resetForm(); }} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-black text-base flex-1">{editingProductId ? "Edit Product" : "Add New Product"}</h1>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-4 pb-20 space-y-5">

          {/* Basic info */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Basic Info</p>
            <div>
              <Input placeholder="Rough product name (e.g. black dress) *" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl h-11" />
              <Button type="button" variant="outline" size="sm" className="w-full rounded-xl mt-2 text-xs gap-1.5" onClick={generateWithAI} disabled={generatingAI}>
                ✨ {generatingAI ? "Generating..." : "Generate Title & Description with AI"}
              </Button>
              {aiError && <p className="text-[10px] text-destructive mt-1">{aiError}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">Fill in the details below first for a more accurate result, then tap generate. You can still edit the result after.</p>
            </div>
            <div>
              <Input placeholder="Your price — what you want to earn (₦) *" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="rounded-xl h-11" />
              {basePrice && Number(basePrice) > 0 && (
                <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Buyers will pay</span>
                  <span className="font-black text-primary">{formatNaira(Number(basePrice) * 1.095)}</span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">Includes KAT's 9.5% platform fee — you keep exactly what you type above.</p>
            </div>
            <Input placeholder="Stock quantity" type="number" value={stockCount} onChange={(e) => setStockCount(e.target.value)} className="rounded-xl h-11" />
            <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl resize-none" rows={3} />
          </div>

          {/* Category */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Category *</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => { setCategory(cat); if (cat === "Thrift") setIsThrift(true); }}
                  className={`text-xs px-2 py-2 rounded-xl border-2 font-medium transition-all ${category === cat ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">👤 Audience</p>
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCES.map((a) => (
                <button key={a} type="button" onClick={() => setAudience(audience === a ? "" : a)}
                  className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${audience === a ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Fit */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">👕 Fit</p>
            <div className="flex flex-wrap gap-1.5">
              {FITS.map((f) => (
                <button key={f} type="button" onClick={() => setFit(fit === f ? "" : f)}
                  className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${fit === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">📏 Length</p>
            <div className="flex flex-wrap gap-1.5">
              {LENGTHS.map((l) => (
                <button key={l} type="button" onClick={() => setLength(length === l ? "" : l)}
                  className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${length === l ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Material */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">🧵 Material</p>
            <div className="flex flex-wrap gap-1.5">
              {MATERIALS.map((m) => (
                <button key={m} type="button" onClick={() => setMaterial(material === m ? "" : m)}
                  className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${material === m ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">🌞 Occasion</p>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((o) => (
                <button key={o} type="button" onClick={() => setOccasion(occasion === o ? "" : o)}
                  className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${occasion === o ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Vibes / Aesthetics */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Vibes / Aesthetics</p>
            <div className="flex flex-wrap gap-2">
              {AESTHETICS.map((a) => (
                <button key={a} type="button"
                  onClick={() => setSelectedAesthetics((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])}
                  className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${selectedAesthetics.includes(a) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Thrift options */}
          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">Thrift / Pre-loved item?</p>
                <p className="text-[11px] text-muted-foreground">Marks this as a one-of-one thrift drop</p>
              </div>
              <button type="button" onClick={() => setIsThrift(!isThrift)}
                className={`w-11 h-6 rounded-full transition-colors shrink-0 ${isThrift ? "bg-purple-500" : "bg-muted-foreground/30"}`}>
                <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${isThrift ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {isThrift && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">Item Condition *</p>
                <div className="grid grid-cols-2 gap-2">
                  {THRIFT_CONDITIONS.map((c) => (
                    <button key={c.value} type="button" onClick={() => setThriftCondition(c.value)}
                      className={`text-left p-2.5 rounded-xl border-2 transition-all ${thriftCondition === c.value ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30" : "border-border hover:border-purple-300"}`}>
                      <p className="text-xs font-bold">{c.label}</p>
                      <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                    </button>
                  ))}
                </div>
                <Input placeholder="Deposit amount (₦)" type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="rounded-xl h-10" />
              </div>
            )}
          </div>

          {/* Package size */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Package Size</p>
            <div className="space-y-2">
              {PACKAGE_SIZES.map((p) => (
                <button key={p.value} type="button" onClick={() => setPackageSize(p.value)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${packageSize === p.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{p.example}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Images ({totalImages}/8) *</p>
            {totalImages > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {existingImages.map((url, i) => (
                  <div key={`e-${i}`} className="relative aspect-square">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button type="button" onClick={() => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                    {i === 0 && <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 text-white px-1 rounded">Main</span>}
                  </div>
                ))}
                {imagePreviews.map((preview, i) => (
                  <div key={`n-${i}`} className="relative aspect-square">
                    <img src={preview} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button type="button" onClick={() => { setImageFiles((prev) => prev.filter((_, idx) => idx !== i)); setImagePreviews((prev) => prev.filter((_, idx) => idx !== i)); }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {totalImages < 8 && (
                  <label className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                  </label>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-muted-foreground">Tap to add images</span>
                <span className="text-xs text-muted-foreground mt-0.5">Up to 8 images</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              </label>
            )}
          </div>

          {/* Video */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Product Video (optional)</p>
            {videoPreview || existingVideoUrl ? (
              <div className="relative">
                <video src={videoPreview || existingVideoUrl} className="w-full rounded-xl" controls />
                <button type="button" onClick={() => { setVideoFile(null); setVideoPreview(""); setExistingVideoUrl(""); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 text-xs text-primary font-semibold cursor-pointer border border-dashed border-border rounded-xl p-3 hover:border-primary/50 transition-colors">
                <Video className="w-4 h-4" /> Add Product Video
                <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setVideoFile(f); setVideoPreview(URL.createObjectURL(f)); setExistingVideoUrl(""); }}} />
              </label>
            )}
          </div>

          {/* Variants */}
          <div className="space-y-3 bg-muted rounded-2xl p-4">
            <button type="button" onClick={() => setShowVariants(!showVariants)} className="w-full flex items-center justify-between text-sm font-bold">
              <span>Variants (Colors, Sizes)</span>
              {showVariants ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showVariants && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Colors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COLORS.map((color) => (
                      <button key={color} type="button"
                        onClick={() => setSelectedColors((prev) => prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color])}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedColors.includes(color) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                        {color}
                      </button>
                    ))}
                  </div>
                  {selectedColors.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {selectedColors.map((color) => {
                        const preview = colorImagePreviews[color] || existingColorImages[color];
                        return (
                          <div key={color} className="space-y-1">
                            <p className="text-[10px] text-muted-foreground">{color}</p>
                            {preview ? (
                              <div className="relative aspect-square">
                                <img src={preview} alt={color} className="w-full h-full object-cover rounded-xl" />
                                <button type="button" onClick={() => { setColorImageFiles((prev) => { const n = { ...prev }; delete n[color]; return n; }); setColorImagePreviews((prev) => { const n = { ...prev }; delete n[color]; return n; }); setExistingColorImages((prev) => { const n = { ...prev }; delete n[color]; return n; }); }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                                  <X className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                                <ImagePlus className="w-4 h-4 text-muted-foreground" />
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleColorImageSelect(color, e)} />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Clothing Sizes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CLOTHING_SIZES.map((size) => (
                      <button key={size} type="button"
                        onClick={() => setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size])}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedSizes.includes(size) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Fit Notes (optional)</p>
                  <Input placeholder='e.g. "Runs small, order up"' value={customSizeNote} onChange={(e) => setCustomSizeNote(e.target.value)} className="rounded-xl h-10 text-xs" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Shoe Sizes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SHOE_SIZES.map((size) => (
                      <button key={size} type="button"
                        onClick={() => setSelectedShoeSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size])}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedShoeSizes.includes(size) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">Different price per variant?</p>
                  <button type="button" onClick={() => setUseVariantPricing(!useVariantPricing)}
                    className={`w-10 h-6 rounded-full transition-colors ${useVariantPricing ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${useVariantPricing ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>

                {(selectedColors.length > 0 || selectedSizes.length > 0 || selectedShoeSizes.length > 0) && (
                  <Button type="button" variant="outline" size="sm" className="w-full rounded-full text-xs" onClick={generateVariants}>
                    Generate Variants
                  </Button>
                )}

                {variants.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {variants.map((v) => (
                      <div key={v.id} className="bg-background rounded-xl p-2.5 space-y-2">
                        <p className="text-xs font-semibold">{[v.color, v.size, v.shoeSize].filter(Boolean).join(" / ")}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {useVariantPricing && <Input placeholder="Price (₦)" type="number" value={v.price || ""} onChange={(e) => updateVariant(v.id, "price", e.target.value)} className="rounded-lg h-8 text-xs" />}
                          <Input placeholder="Stock qty" type="number" value={v.stock || ""} onChange={(e) => updateVariant(v.id, "stock", e.target.value)} className="rounded-lg h-8 text-xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seller note */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              🔒 Private Seller Note
            </p>
            <Textarea placeholder='Only visible to you. e.g. "Stored in box 3"' value={sellerNote} onChange={(e) => setSellerNote(e.target.value)} className="rounded-xl resize-none text-xs" rows={2} />
            <p className="text-[10px] text-muted-foreground">Buyers cannot see this note.</p>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {uploadError}
            </div>
          )}

          <Button className="w-full rounded-full h-12 font-bold" onClick={saveProduct} disabled={uploading}>
            {uploading ? "Saving..." : editingProductId ? "Save Changes" : "Publish Product"}
          </Button>
        </div>
      </div>
    );
  }

  // ── MAIN DASHBOARD ──
  return (
    <div className="min-h-screen bg-background flex">

      {/* New order alert */}
      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground text-sm font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <Bell className="w-4 h-4" /> New order received! 🎉
        </div>
      )}

      {/* Sidebar — desktop */}
      <aside className="w-60 shrink-0 bg-card border-r border-border min-h-screen sticky top-0 hidden md:flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/"><span className="text-xl font-black text-primary cursor-pointer">KAT</span></Link>
          <p className="text-[10px] text-muted-foreground mt-0.5">Seller Center</p>
        </div>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-primary">{(user.name || user.email || "KA").slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{user.name || "Seller"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.key} onClick={() => setSection(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${section === item.key ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {item.icon} {item.label}
              {item.key === "orders" && pendingOrders.length > 0 && (
                <span className="ml-auto bg-destructive text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingOrders.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          <Button size="sm" className="w-full rounded-xl gap-1 text-xs" onClick={() => { resetForm(); setShowUpload(true); }}>
            <Plus className="w-3.5 h-3.5" /> Add Product
          </Button>
          <Link href="/me">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-all">
              <ChevronRight className="w-4 h-4 rotate-180" /> Back to KAT
            </button>
          </Link>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/me"><span className="text-lg font-black text-primary">KAT</span></Link>
          <p className="text-xs font-semibold">Seller Center</p>
          <div className="flex gap-1">
            <button onClick={() => { resetForm(); setShowUpload(true); }} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
            <button onClick={fetchAll} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex overflow-x-auto scrollbar-hide px-2 pb-2 gap-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.key} onClick={() => setSection(item.key)}
              className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${section === item.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 md:pt-0 pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6">

          {section === "home" && <SellerHomeSection user={user} products={products} orders={orders} pendingOrders={pendingOrders} toShip={toShip} incompleteProducts={incompleteProducts} revenue={revenue} onNavigate={setSection} loading={loading} onAddProduct={() => { resetForm(); setShowUpload(true); }} />}

          {section === "products" && <SellerProductsSection products={products} onEdit={openEdit} onDelete={deleteProduct} onAdd={() => { resetForm(); setShowUpload(true); }} />}

          {section === "orders" && <SellerOrdersSection orders={orders} onUpdateStatus={updateOrderStatus} />}

          {section === "promotions" && (
            <div className="text-center py-20">
              <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-bold text-sm">No active promotions</p>
              <p className="text-xs text-muted-foreground mt-1">Coupon and discount tools coming soon.</p>
            </div>
          )}

          {section === "statements" && <SellerStatementsSection orders={orders} revenue={revenue} />}

          {section === "settings" && <SellerSettingsSection user={user} />}
        </div>
      </main>
    </div>
  );
}

// ── HOME SECTION ──
function SellerHomeSection({ user, products, orders, pendingOrders, toShip, incompleteProducts, revenue, onNavigate, loading, onAddProduct }: any) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black">Hey {user.name || "there"} 👋</h1>

      <div>
        <p className="text-sm font-bold mb-3">Yours to do</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {products.length === 0 && (
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <p className="text-sm font-bold mb-1">No products yet</p>
              <p className="text-xs text-muted-foreground mb-3">List products to start selling on KAT</p>
              <Button size="sm" className="rounded-full text-xs" onClick={onAddProduct}>Add First Product</Button>
            </div>
          )}
          {incompleteProducts.length > 0 && (
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <p className="text-sm font-bold mb-1">Incomplete listings ({incompleteProducts.length})</p>
              <p className="text-xs text-muted-foreground mb-3">Finish setting these up so buyers can find them</p>
              <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => onNavigate("products")}>Review Listings</Button>
            </div>
          )}
          {pendingOrders.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <p className="text-sm font-bold mb-1 text-amber-700 dark:text-amber-400">Pending orders ({pendingOrders.length})</p>
              <p className="text-xs text-muted-foreground mb-3">These orders need to be processed</p>
              <Button size="sm" className="rounded-full text-xs" onClick={() => onNavigate("orders")}>Process Orders</Button>
            </div>
          )}
          {toShip.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
              <p className="text-sm font-bold mb-1 text-blue-700 dark:text-blue-400">In progress ({toShip.length})</p>
              <p className="text-xs text-muted-foreground mb-3">Mark these ready for pickup once packed</p>
              <Button size="sm" className="rounded-full text-xs" onClick={() => onNavigate("orders")}>View Orders</Button>
            </div>
          )}
          {products.length > 0 && pendingOrders.length === 0 && toShip.length === 0 && incompleteProducts.length === 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 sm:col-span-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">You're all caught up!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold mb-3">Business Metrics</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Revenue", value: formatNaira(revenue), icon: <DollarSign className="w-4 h-4 text-primary" /> },
            { label: "Orders", value: orders.length, icon: <ShoppingCart className="w-4 h-4 text-primary" /> },
            { label: "Products", value: products.length, icon: <Package className="w-4 h-4 text-primary" /> },
            { label: "Avg Rating", value: "—", icon: <Star className="w-4 h-4 text-primary" /> },
          ].map((m) => (
            <div key={m.label} className="bg-card border border-card-border rounded-2xl p-4">
              {m.icon}
              <p className="text-lg font-black mt-1">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PRODUCTS TABLE SECTION ──
function SellerProductsSection({ products, onEdit, onDelete, onAdd }: any) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = products.filter((p: any) => {
    if (activeTab === "active") return p.in_stock !== false && !p.is_thrift;
    if (activeTab === "thrift") return p.is_thrift;
    if (activeTab === "out") return p.in_stock === false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Products</h2>
        <Button size="sm" className="rounded-full gap-1 text-xs" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" /> Add Product
        </Button>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {[
          { key: "all", label: `All (${products.length})` },
          { key: "active", label: "Active" },
          { key: "thrift", label: "Thrift" },
          { key: "out", label: "Out of Stock" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${activeTab === tab.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-sm">No products here</p>
          <Button size="sm" className="rounded-full mt-3 text-xs" onClick={onAdd}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p: any) => (
            <div key={p.id} className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-center">
              {p.image_url ? (
                <img src={p.image_url} alt={p.title} className="w-16 h-16 object-cover rounded-xl shrink-0 bg-muted" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.title}</p>
                <p className="text-xs text-primary font-bold mt-0.5">{formatNaira(p.price)}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {p.category && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{p.category}</span>}
                  {p.is_thrift && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Thrift</span>}
                  {p.thrift_condition && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">{p.thrift_condition.replace("_", " ")}</span>}
                  {p.in_stock === false && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Out of stock</span>}
                  {p.stock_count > 0 && <span className="text-[10px] text-muted-foreground">{p.stock_count} in stock</span>}
                </div>
                {p.aesthetics && p.aesthetics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.aesthetics.slice(0, 3).map((a: string) => (
                      <span key={a} className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => onEdit(p)} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-primary" />
                </button>
                <button onClick={() => onDelete(p.id)} className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ORDERS SECTION ──
function SellerOrdersSection({ orders, onUpdateStatus }: any) {
  const [filter, setFilter] = useState("all");

  const filtered = orders.filter((o: any) => {
    if (filter === "all") return true;
    return (o.admin_status || "pending") === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Orders</h2>
        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
        </span>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {["all", "pending", "accepted", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "completed", "cancelled"].map((s) => {
          const count = s === "all" ? orders.length : orders.filter((o: any) => (o.admin_status || "pending") === s).length;
          const label = s === "all" ? "All" : (ORDER_STATUS_CONFIG[s]?.label || s);
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
              {label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
          <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-sm">No orders here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o: any) => {
            const status = o.admin_status || "pending";
            const cfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
            const handedOff = !SELLER_CONTROLLED_STATUSES.includes(status) && status !== "pending";
            return (
              <div key={o.id} className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Order #{o.id.slice(0, 8)}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary">{formatNaira(o.total || o.amount)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
                  </div>
                </div>
                {(o.buyer_name || o.buyer_address) && (
                  <div className="bg-muted rounded-xl p-2.5 text-xs space-y-0.5">
                    {o.buyer_name && <p><span className="font-semibold">Buyer:</span> {o.buyer_name}</p>}
                    {o.buyer_phone && <p><span className="font-semibold">Phone:</span> {o.buyer_phone}</p>}
                    {o.buyer_address && <p><span className="font-semibold">Address:</span> {o.buyer_address}</p>}
                  </div>
                )}
                {handedOff ? (
                  <p className="text-xs text-muted-foreground italic">This order has been picked up — KAT logistics is now handling delivery.</p>
                ) : (
                  <div className="flex gap-1.5 flex-wrap">
                    {SELLER_CONTROLLED_STATUSES.map((s) => (
                      <button key={s} onClick={() => onUpdateStatus(o.id, s)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${status === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                        {ORDER_STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── STATEMENTS SECTION ──
function SellerStatementsSection({ orders, revenue }: any) {
  // revenue = what buyers paid, which already includes the 9.5% markup.
  // Back out the seller's true share instead of taking another 9.5% off the top.
  const netEarnings = revenue / 1.095;
  const commission = revenue - netEarnings;
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black">Account Statements</h2>
      <div className="bg-card border border-card-border rounded-2xl p-5 space-y-3">
        {[
          { label: "Gross Revenue", value: formatNaira(revenue) },
          { label: "KAT Commission (9.5%)", value: `-${formatNaira(commission)}`, negative: true },
          { label: "Net Earnings", value: formatNaira(netEarnings), bold: true },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <p className="text-sm text-muted-foreground">{row.label}</p>
            <p className={`text-sm font-bold ${row.negative ? "text-destructive" : ""} ${row.bold ? "text-primary text-base" : ""}`}>{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SETTINGS SECTION ──
function SellerSettingsSection({ user }: any) {
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("store_name, store_description").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setStoreName(data.store_name || "");
        setStoreDescription(data.store_description || "");
      }
    });
  }, [user.id]);

  const saveSettings = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ store_name: storeName, store_description: storeDescription }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black">Store Settings</h2>
      <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" /> Store Info
        </p>
        <Input placeholder="Store name" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="rounded-xl h-11" />
        <Textarea placeholder="Store description (visible to buyers on your store page)" value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} className="rounded-xl resize-none" rows={3} />
        <Button className="rounded-full w-full" onClick={saveSettings} disabled={saving}>
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
   }

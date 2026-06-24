import React, { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft, Plus, Package, ShoppingCart, TrendingUp, Eye,
  Trash2, Lock, LogIn, AlertCircle, X, ImagePlus, Video,
  ChevronDown, ChevronUp, Pencil, RefreshCw, Bell,
  BarChart2, DollarSign, Star, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, Truck, XCircle, RotateCcw, StickyNote,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
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
const CATEGORIES = ["Woman", "Men", "Kids", "Shoes", "Jewelry & Accessories", "Beauty & Health", "Gym & Outdoor", "Phone & Accessories", "Home", "Thrift"];

interface Variant {
  id: string;
  color?: string;
  size?: string;
  shoeSize?: string;
  price?: string;
  stock?: string;
}

type SellerTab = "overview" | "products" | "orders" | "analytics";

const ORDER_STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending:    { label: "Pending",    className: "bg-amber-100 text-amber-700",   icon: <Clock className="w-3 h-3" /> },
  processing: { label: "Processing", className: "bg-blue-100 text-blue-700",     icon: <Package className="w-3 h-3" /> },
  shipped:    { label: "Shipped",    className: "bg-purple-100 text-purple-700", icon: <Truck className="w-3 h-3" /> },
  delivered:  { label: "Delivered",  className: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled:  { label: "Cancelled",  className: "bg-red-100 text-red-700",       icon: <XCircle className="w-3 h-3" /> },
};

const CHART_COLORS = ["#e0508a", "#9b59d6", "#3b82f6", "#4a9e6e", "#f59e0b"];

export default function Seller() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SellerTab>("overview");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [views, setViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");

  // Form state
  const [title, setTitle] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isThrift, setIsThrift] = useState(false);
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
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const productsListRef = useRef<HTMLDivElement>(null);

  // Derived stats
  const revenue = orders.reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const ordersCount = orders.length;
  const pendingOrders = orders.filter((o) => (o.seller_status || "pending") === "pending").length;
  const avgOrderValue = ordersCount > 0 ? revenue / ordersCount : 0;

  // Chart data
  const generateChartData = () => {
    const now = new Date();
    if (chartPeriod === "daily") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        const label = d.toLocaleDateString("en-NG", { weekday: "short" });
        const dayOrders = orders.filter((o) => {
          const od = new Date(o.created_at);
          return od.toDateString() === d.toDateString();
        });
        return {
          name: label,
          revenue: dayOrders.reduce((s, o) => s + (o.total || o.amount || 0), 0),
          orders: dayOrders.length,
        };
      });
    }
    if (chartPeriod === "weekly") {
      return Array.from({ length: 6 }, (_, i) => {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (5 - i) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const label = `W${i + 1}`;
        const weekOrders = orders.filter((o) => {
          const od = new Date(o.created_at);
          return od >= weekStart && od < weekEnd;
        });
        return {
          name: label,
          revenue: weekOrders.reduce((s, o) => s + (o.total || o.amount || 0), 0),
          orders: weekOrders.length,
        };
      });
    }
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleDateString("en-NG", { month: "short" });
      const monthOrders = orders.filter((o) => {
        const od = new Date(o.created_at);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
      });
      return {
        name: label,
        revenue: monthOrders.reduce((s, o) => s + (o.total || o.amount || 0), 0),
        orders: monthOrders.length,
      };
    });
  };

  const chartData = generateChartData();

  // Category breakdown for pie chart
  const categoryData = products.reduce((acc: Record<string, number>, p) => {
    const cat = p.category || "Uncategorised";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (productsData) setProducts(productsData);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersData) setOrders(ordersData);

    const { data: viewsData } = await supabase
      .from("product_views")
      .select("*")
      .in("product_id", (productsData || []).map((p) => p.id));

    if (viewsData) setViews(viewsData.length);

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    // Real-time order updates
    const channel = supabase
      .channel("seller-orders")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `seller_id=eq.${user?.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setOrders((prev) => [payload.new as any, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setOrders((prev) => prev.map((o) => o.id === (payload.new as any).id ? payload.new as any : o));
        } else if (payload.eventType === "DELETE") {
          setOrders((prev) => prev.filter((o) => o.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase
      .from("orders")
      .update({ seller_status: status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, seller_status: status } : o));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCurrent = imageFiles.length + existingImages.length;
    const remaining = 8 - totalCurrent;
    const newFiles = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setExistingVideoUrl("");
  };

  const handleColorImageSelect = (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setColorImageFiles((prev) => ({ ...prev, [color]: file }));
    setColorImagePreviews((prev) => ({ ...prev, [color]: URL.createObjectURL(file) }));
  };

  const removeColorImage = (color: string) => {
    setColorImageFiles((prev) => { const next = { ...prev }; delete next[color]; return next; });
    setColorImagePreviews((prev) => { const next = { ...prev }; delete next[color]; return next; });
    setExistingColorImages((prev) => { const next = { ...prev }; delete next[color]; return next; });
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
            newVariants.push(existing || {
              id: Math.random().toString(36).slice(2),
              color, size, shoeSize, price: basePrice, stock: "10",
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

  const resetForm = () => {
    setTitle(""); setBasePrice(""); setDescription("");
    setCategory(""); setIsThrift(false); setSellerNote("");
    setImageFiles([]); setImagePreviews([]); setExistingImages([]);
    setVideoFile(null); setVideoPreview(""); setExistingVideoUrl("");
    setVariants([]); setSelectedColors([]); setSelectedSizes([]); setSelectedShoeSizes([]);
    setUseVariantPricing(false); setShowVariants(false);
    setUploadError(null); setEditingProductId(null);
    setCustomSizeNote(""); setShowSizeGuide(false);
    setColorImageFiles({}); setColorImagePreviews({}); setExistingColorImages({});
  };

  const openEdit = (p: any) => {
    setEditingProductId(p.id);
    setTitle(p.title || "");
    setBasePrice(String(p.price ?? ""));
    setDescription(p.description || "");
    setCategory(p.category || "");
    setIsThrift(Boolean(p.is_thrift));
    setSellerNote(p.seller_note || "");
    setExistingImages(Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []));
    setImageFiles([]); setImagePreviews([]);
    setExistingVideoUrl(p.video_url || "");
    setVideoFile(null); setVideoPreview("");
    const v: Variant[] = Array.isArray(p.variants) ? p.variants : [];
    setVariants(v);
    setUseVariantPricing(Boolean(p.use_variant_pricing));
    setShowVariants(v.length > 0);
    setSelectedColors(Array.from(new Set(v.map((x) => x.color).filter(Boolean))) as string[]);
    setSelectedSizes(Array.from(new Set(v.map((x) => x.size).filter(Boolean))) as string[]);
    setSelectedShoeSizes(Array.from(new Set(v.map((x) => x.shoeSize).filter(Boolean))) as string[]);
    setCustomSizeNote(p.custom_size_note || "");
    setExistingColorImages(p.color_images || {});
    setColorImageFiles({}); setColorImagePreviews({});
    setUploadError(null);
    setShowUpload(true);
  };

  const saveProduct = async () => {
    if (!title.trim() || !basePrice) { setUploadError("Please fill in title and price."); return; }
    const totalImages = existingImages.length + imageFiles.length;
    if (totalImages === 0) { setUploadError("Please add at least one image."); return; }
    if (!category) { setUploadError("Please select a category."); return; }

    setUploading(true);
    setUploadError(null);

    const newImageUrls = await uploadImages();
    const allImages = [...existingImages, ...newImageUrls];
    let videoUrl = existingVideoUrl;
    if (videoFile) videoUrl = await uploadVideo();
    const colorImages = await uploadColorImages();

    const payload = {
      title, description, category,
      price: Number(basePrice),
      image_url: allImages[0] || "",
      images: allImages,
      video_url: videoUrl || null,
      variants: variants.length > 0 ? variants : null,
      use_variant_pricing: useVariantPricing,
      custom_size_note: customSizeNote.trim() || null,
      color_images: Object.keys(colorImages).length > 0 ? colorImages : null,
      is_thrift: isThrift,
      seller_note: sellerNote.trim() || null,
    };

    if (editingProductId) {
      const { data, error } = await supabase
        .from("products").update(payload).eq("id", editingProductId).select().single();
      setUploading(false);
      if (!error && data) {
        setProducts((prev) => prev.map((p) => p.id === editingProductId ? data : p));
        setShowUpload(false); resetForm();
      } else { setUploadError(error?.message || "Failed to update product."); }
    } else {
      const { data, error } = await supabase
        .from("products").insert({ ...payload, seller_id: user?.id }).select().single();
      setUploading(false);
      if (!error && data) {
        setProducts((prev) => [data, ...prev]);
        setShowUpload(false); resetForm();
      } else { setUploadError(error?.message || "Failed to add product."); }
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
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

  const totalImages = existingImages.length + imageFiles.length;

  const TABS: { key: SellerTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: "products", label: "Products", icon: <Package className="w-3.5 h-3.5" /> },
    { key: "orders", label: "Orders", icon: <ShoppingCart className="w-3.5 h-3.5" /> },
    { key: "analytics", label: "Analytics", icon: <BarChart2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-3xl mx-auto px-4 py-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/me">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-base text-center">Seller Dashboard</h1>
            <p className="text-[11px] text-muted-foreground text-center">{user.name || user.email}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <Button onClick={() => { resetForm(); setShowUpload(true); }} className="rounded-full h-9 gap-1 text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-2xl mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-background shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-4">

            {/* Pending orders alert */}
            {pendingOrders > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3">
                <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  You have {pendingOrders} pending order{pendingOrders > 1 ? "s" : ""} to process
                </p>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="ml-auto text-xs text-amber-700 font-bold underline shrink-0"
                >
                  View
                </button>
              </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: <DollarSign className="w-5 h-5 text-primary" />,
                  label: "Total Revenue",
                  value: formatNaira(revenue),
                  sub: `${ordersCount} orders`,
                  trend: null,
                },
                {
                  icon: <ShoppingCart className="w-5 h-5 text-primary" />,
                  label: "Orders",
                  value: ordersCount,
                  sub: `${pendingOrders} pending`,
                  trend: null,
                },
                {
                  icon: <Package className="w-5 h-5 text-primary" />,
                  label: "Products",
                  value: products.length,
                  sub: "listed",
                  trend: null,
                },
                {
                  icon: <Eye className="w-5 h-5 text-primary" />,
                  label: "Product Views",
                  value: views,
                  sub: "total",
                  trend: null,
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-card-border rounded-2xl p-4 space-y-1">
                  {stat.icon}
                  <p className="text-xl font-black text-primary">{stat.value}</p>
                  <p className="text-xs font-semibold">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Revenue chart */}
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-sm">Revenue</p>
                <div className="flex gap-1">
                  {(["daily", "weekly", "monthly"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setChartPeriod(p)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all ${
                        chartPeriod === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {revenue === 0 ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                  No revenue data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number) => formatNaira(v)}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent orders */}
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-sm">Recent Orders</p>
                <button onClick={() => setActiveTab("orders")} className="text-xs text-primary font-semibold">
                  View all
                </button>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 3).map((o) => {
                    const status = o.seller_status || "pending";
                    const cfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
                    return (
                      <div key={o.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
                        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${cfg.className}`}>
                          {cfg.icon} {cfg.label}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">Order #{o.id.slice(0, 8)}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className="text-xs font-black text-primary shrink-0">{formatNaira(o.total || o.amount)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Financial summary */}
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
              <p className="font-bold text-sm">Financial Summary</p>
              {[
                { label: "Gross Revenue", value: formatNaira(revenue) },
                { label: "KAT Commission (5%)", value: `-${formatNaira(revenue * 0.05)}` },
                { label: "Net Earnings", value: formatNaira(revenue * 0.95) },
                { label: "Avg Order Value", value: formatNaira(avgOrderValue) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={`text-sm font-bold ${label === "KAT Commission (5%)" ? "text-destructive" : "text-foreground"}`}>{value}</p>
                </div>
              ))}
              <div className="border-t border-border pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Pending Payout</p>
                  <p className="text-sm font-black text-primary">{formatNaira(revenue * 0.95)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === "products" && (
          <div className="space-y-3" ref={productsListRef}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">{products.length} Product{products.length !== 1 ? "s" : ""}</p>
              <Button onClick={() => { resetForm(); setShowUpload(true); }} className="rounded-full h-8 gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Product
              </Button>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-sm">No products yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add your first product to get started</p>
                <Button onClick={() => { resetForm(); setShowUpload(true); }} className="rounded-full mt-4 text-xs" size="sm">
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
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {p.category && (
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{p.category}</span>
                      )}
                      {p.is_thrift && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Thrift</span>
                      )}
                      {p.variants && p.variants.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">{p.variants.length} variants</span>
                      )}
                    </div>
                    {p.seller_note && (
                      <div className="flex items-center gap-1 mt-1">
                        <StickyNote className="w-3 h-3 text-amber-500 shrink-0" />
                        <p className="text-[10px] text-amber-600 truncate">{p.seller_note}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">{orders.length} Order{orders.length !== 1 ? "s" : ""}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
                <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-sm">No orders yet</p>
                <p className="text-xs text-muted-foreground mt-1">Orders assigned to you will appear here</p>
              </div>
            ) : (
              orders.map((o, i) => {
                const status = o.seller_status || "pending";
                const cfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
                const SELLER_STATUSES = ["pending", "processing", "shipped", "delivered"];
                return (
                  <div key={o.id} className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">Order #{o.id.slice(0, 8)}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-primary">{formatNaira(o.total || o.amount)}</p>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.className}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                    </div>

                    {(o.buyer_name || o.buyer_address) && (
                      <div className="bg-muted rounded-xl p-2.5 text-xs space-y-0.5">
                        {o.buyer_name && <p><span className="font-semibold">Buyer:</span> {o.buyer_name}</p>}
                        {o.buyer_phone && <p><span className="font-semibold">Phone:</span> {o.buyer_phone}</p>}
                        {o.buyer_address && <p><span className="font-semibold">Address:</span> {o.buyer_address}</p>}
                      </div>
                    )}

                    {o.variant && (
                      <p className="text-xs text-muted-foreground">
                        Variant: {[o.variant.color, o.variant.size, o.variant.shoeSize].filter(Boolean).join(" / ")}
                      </p>
                    )}

                    <div className="flex gap-1.5 flex-wrap">
                      {SELLER_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateOrderStatus(o.id, s)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                            status === s
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {ORDER_STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === "analytics" && (
          <div className="space-y-4">

            {/* Orders chart */}
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-sm">Orders Over Time</p>
                <div className="flex gap-1">
                  {(["daily", "weekly", "monthly"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setChartPeriod(p)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all ${
                        chartPeriod === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {orders.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No order data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category breakdown */}
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <p className="font-bold text-sm mb-4">Products by Category</p>
              {pieData.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No products yet</div>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value">
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <p className="text-xs text-muted-foreground truncate flex-1">{entry.name}</p>
                        <p className="text-xs font-bold shrink-0">{entry.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Conversion rate */}
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
              <p className="font-bold text-sm">Performance</p>
              {[
                { label: "Total Views", value: views },
                { label: "Total Orders", value: ordersCount },
                { label: "Conversion Rate", value: views > 0 ? `${((ordersCount / views) * 100).toFixed(1)}%` : "0%" },
                { label: "Avg Order Value", value: formatNaira(avgOrderValue) },
                { label: "Products Listed", value: products.length },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>

            {/* Returns placeholder */}
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2">
              <p className="font-bold text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-primary" /> Returns
              </p>
              <p className="text-sm text-muted-foreground">No return requests yet.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── ADD/EDIT PRODUCT FULL PAGE DIALOG ── */}
      <Dialog open={showUpload} onOpenChange={(open) => { if (!open) resetForm(); setShowUpload(open); }}>
        <DialogContent className="fixed inset-0 w-full h-full max-w-none max-h-none rounded-none m-0 overflow-y-auto bg-background">
          <div className="max-w-lg mx-auto px-4 py-4">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowUpload(false); resetForm(); }}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <DialogTitle className="font-black text-lg">
                  {editingProductId ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-5">

              {/* Basic info */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Basic Info</p>
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
              </div>

              {/* Category + Thrift */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Category</p>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`text-xs px-2 py-2 rounded-xl border-2 font-medium transition-all ${
                        category === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">Thrift / Pre-loved item?</p>
                    <p className="text-[11px] text-muted-foreground">Marks this as a one-of-one thrift drop</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsThrift(!isThrift)}
                    className={`w-11 h-6 rounded-full transition-colors shrink-0 ${isThrift ? "bg-purple-500" : "bg-muted-foreground/30"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${isThrift ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Images ({totalImages}/8) *</p>
                {totalImages > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {existingImages.map((url, i) => (
                      <div key={`existing-${i}`} className="relative aspect-square">
                        <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                        <button type="button" onClick={() => removeExistingImage(i)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {i === 0 && <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 text-white px-1 rounded">Main</span>}
                      </div>
                    ))}
                    {imagePreviews.map((preview, i) => (
                      <div key={`new-${i}`} className="relative aspect-square">
                        <img src={preview} alt="" className="w-full h-full object-cover rounded-xl" />
                        <button type="button" onClick={() => removeNewImage(i)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {existingImages.length === 0 && i === 0 && <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 text-white px-1 rounded">Main</span>}
                      </div>
                    ))}
                    {totalImages < 8 && (
                      <label className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                        <ImagePlus className="w-5 h-5 text-muted-foreground" />
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                      </label>
                    )}
                  </div>
                )}
                {totalImages === 0 && (
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
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
                  </label>
                )}
              </div>

              {/* Variants */}
              <div className="space-y-3 bg-muted rounded-2xl p-4">
                <button
                  type="button"
                  onClick={() => setShowVariants(!showVariants)}
                  className="w-full flex items-center justify-between text-sm font-bold"
                >
                  <span>Variants (Colors, Sizes)</span>
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
                            onClick={() => setSelectedColors((prev) => prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color])}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedColors.includes(color) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>

                      {selectedColors.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">Color Images (optional)</p>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedColors.map((color) => {
                              const preview = colorImagePreviews[color] || existingColorImages[color];
                              return (
                                <div key={color} className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground">{color}</p>
                                  {preview ? (
                                    <div className="relative aspect-square">
                                      <img src={preview} alt={color} className="w-full h-full object-cover rounded-xl" />
                                      <button type="button" onClick={() => removeColorImage(color)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
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
                        </div>
                      )}
                    </div>

                    {/* Clothing Sizes */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Clothing Sizes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {CLOTHING_SIZES.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size])}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedSizes.includes(size) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fit notes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground">Fit Notes (optional)</p>
                        <button
                          type="button"
                          onClick={() => setShowSizeGuide(!showSizeGuide)}
                          className="text-[10px] text-primary font-semibold"
                        >
                          {showSizeGuide ? "Hide" : "Add"} size guide info
                        </button>
                      </div>
                      <Input
                        placeholder='e.g. "Fits XXL, very stretchy" or "Runs small, order up"'
                        value={customSizeNote}
                        onChange={(e) => setCustomSizeNote(e.target.value)}
                        className="rounded-xl h-10 text-xs"
                      />
                    </div>

                    {/* Shoe Sizes */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Shoe Sizes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SHOE_SIZES.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedShoeSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size])}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedShoeSizes.includes(size) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Variant pricing */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">Different price per variant?</p>
                      <button
                        type="button"
                        onClick={() => setUseVariantPricing(!useVariantPricing)}
                        className={`w-10 h-6 rounded-full transition-colors ${useVariantPricing ? "bg-primary" : "bg-muted-foreground/30"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${useVariantPricing ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* Generate variants */}
                    {(selectedColors.length > 0 || selectedSizes.length > 0 || selectedShoeSizes.length > 0) && (
                      <Button type="button" variant="outline" size="sm" className="w-full rounded-full text-xs" onClick={generateVariants}>
                        Generate {variants.length > 0 ? "& Update" : ""} Variants
                      </Button>
                    )}

                    {/* Variant list */}
                    {variants.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">{variants.length} Variant{variants.length > 1 ? "s" : ""}</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {variants.map((v) => (
                            <div key={v.id} className="bg-background rounded-xl p-2.5 space-y-2">
                              <p className="text-xs font-semibold">{[v.color, v.size, v.shoeSize].filter(Boolean).join(" / ")}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {useVariantPricing && (
                                  <Input placeholder="Price (₦)" type="number" value={v.price || ""} onChange={(e) => updateVariant(v.id, "price", e.target.value)} className="rounded-lg h-8 text-xs" />
                                )}
                                <Input placeholder="Stock qty" type="number" value={v.stock || ""} onChange={(e) => updateVariant(v.id, "stock", e.target.value)} className="rounded-lg h-8 text-xs" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Seller-only note */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <StickyNote className="w-3.5 h-3.5 text-amber-500" /> Private Seller Note
                </p>
                <Textarea
                  placeholder='Only visible to you. e.g. "Stored in box 3, shelf B" or "Restock from supplier end of June"'
                  value={sellerNote}
                  onChange={(e) => setSellerNote(e.target.value)}
                  className="rounded-xl resize-none text-xs"
                  rows={2}
                />
                <p className="text-[10px] text-muted-foreground">This note is private — buyers cannot see it.</p>
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
        </DialogContent>
      </Dialog>
    </div>
  );
  }

import React, { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import {
  Home, Package, ShoppingCart, Megaphone, FileText, Settings,
  LogIn, Lock, Plus, Bell, ChevronRight, AlertCircle, Star,
  Truck, Clock, CheckCircle2, XCircle, RefreshCw, DollarSign,
  Pencil, Trash2, X, ImagePlus, Video, ChevronDown, ChevronUp,
  ArrowLeft, BarChart2, Store, BadgeCheck, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TOP_CATEGORIES, SUBCATEGORIES, AESTHETICS as CANONICAL_AESTHETICS } from "@/data/listings";
import { getAttributeFieldsForSubcategory, NATIVE_ATTRIBUTE_COLUMNS } from "@/lib/product-attributes";
import { COLORS, CLOTHING_SIZES, SHOE_SIZES } from "@/lib/product-option-sets";
import type { ProductVariant } from "@/lib/product-variants";
import CategoryStep from "@/components/seller/add-product/CategoryStep";
import AttributesStep from "@/components/seller/add-product/AttributesStep";
import VariantsStep from "@/components/seller/add-product/VariantsStep";
import ReviewStep from "@/components/seller/add-product/ReviewStep";
import StepProgress from "@/components/seller/add-product/StepProgress";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

type SellerSection = "home" | "products" | "orders" | "promotions" | "statements" | "settings";

const CATEGORIES = ["Women", "Men", "Kids", "Shoes", "Jewelry & Accessories", "Beauty & Health", "Gym & Outdoor", "Phone & Accessories", "Home", "Thrift"];
// NOTE: CATEGORIES above is no longer used by the Add Product flow (CategoryStep uses
// canonical TOP_CATEGORIES/SUBCATEGORIES instead) but is left in place in case anything
// else in this file still references it. Safe to remove later after verifying no other usage.
const AUDIENCES = ["Women", "Men", "Girls", "Boys", "Babies", "Teens", "Unisex"];
const FITS = ["Slim", "Regular", "Loose", "Oversized"];
const LENGTHS = ["Short", "Midi", "Long"];
const MATERIALS = ["Cotton", "Linen", "Denim", "Polyester", "Silk", "Wool", "Leather", "Chiffon", "Ankara", "Lace"];
const OCCASIONS = ["Casual", "Formal", "Party", "Office", "Sports", "Beach", "Wedding", "Everyday"];
// NOTE: AUDIENCES/FITS/LENGTHS/MATERIALS/OCCASIONS above are also superseded by
// product-attributes.ts's ATTRIBUTE_GROUPS["fashion-core"], left in place harmlessly.

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
  { key: "home",       label: "Dashboard",  icon: <Home className="w-4 h-4" /> },
  { key: "products",   label: "Products",   icon: <Package className="w-4 h-4" /> },
  { key: "orders",     label: "Orders",     icon: <ShoppingCart className="w-4 h-4" /> },
  { key: "promotions", label: "Promotions", icon: <Megaphone className="w-4 h-4" /> },
  { key: "statements", label: "Statements", icon: <FileText className="w-4 h-4" /> },
  { key: "settings",   label: "Settings",   icon: <Settings className="w-4 h-4" /> },
];

export default function Seller() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      alert("CRASH: " + e.message + "\n" + (e.error?.stack || "").slice(0, 300));
    };
    const handleRejection = (e: PromiseRejectionEvent) => {
      alert("UNHANDLED PROMISE: " + (e.reason?.message || e.reason));
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  const [section, setSection] = useState<SellerSection>("home");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [stores, setStores] = useState<any[]>([]);
  const [isMultiStore, setIsMultiStore] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [storePendingCounts, setStorePendingCounts] = useState<Record<string, number>>({});

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
  const [variants, setVariants] = useState<ProductVariant[]>([]);
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

  // ── NEW: Add Product step + category/attribute state ──
  const [addStep, setAddStep] = useState(0); // 0=Category 1=Details 2=Attributes 3=Images 4=Variants 5=Pricing 6=Review
  const [subcategory, setSubcategory] = useState("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [existingAttributes, setExistingAttributes] = useState<Record<string, any>>({});
  const [aestheticsTouched, setAestheticsTouched] = useState(false);
  const [skuInput, setSkuInput] = useState("");

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles").select("is_multi_store").eq("id", user.id).single();
      if (profileError) throw new Error("profile: " + profileError.message);

      const multiStore = Boolean(profileData?.is_multi_store);
      setIsMultiStore(multiStore);

      let storesData: any[] = [];
      if (multiStore) {
        const { data, error: storesErr } = await supabase
          .from("stores").select("*").eq("owner_id", user.id).order("created_at");
        if (storesErr) throw new Error("stores: " + storesErr.message);
        storesData = data || [];
        setStores(storesData);

        if (!selectedStoreId) {
          const remembered = localStorage.getItem("kat_active_store");
          if (remembered && storesData.some((s) => s.id === remembered)) {
            setSelectedStoreId(remembered);
          }
        }

        const { data: pendingOrdersData, error: pendingErr } = await supabase
          .from("orders").select("store_id").eq("seller_id", user.id).eq("admin_status", "pending");
        if (pendingErr) throw new Error("pending orders: " + pendingErr.message);
        const counts: Record<string, number> = {};
        (pendingOrdersData || []).forEach((o: any) => {
          if (o.store_id) counts[o.store_id] = (counts[o.store_id] || 0) + 1;
        });
        setStorePendingCounts(counts);
      }

      const activeStoreId = multiStore ? selectedStoreId : null;
      if (multiStore && !activeStoreId) {
        return;
      }

      let productsQuery = supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
      let ordersQuery = supabase.from("orders").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
      if (multiStore && activeStoreId) {
        productsQuery = productsQuery.eq("store_id", activeStoreId);
        ordersQuery = ordersQuery.eq("store_id", activeStoreId);
      }

      const { data: productsData, error: productsErr } = await productsQuery;
      if (productsErr) throw new Error("products: " + productsErr.message);
      if (productsData) setProducts(productsData);

      const { data: ordersData, error: ordersErr } = await ordersQuery;
      if (ordersErr) throw new Error("orders: " + ordersErr.message);
      if (ordersData) setOrders(ordersData);

    } catch (err: any) {
      console.error("FETCH ALL FAILED:", err);
      setFetchError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();

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

    const urlParams = new URLSearchParams(window.location.search);
    const forcedStoreId = urlParams.get("store");
    if (forcedStoreId) {
      localStorage.setItem("kat_active_store", forcedStoreId);
      setSelectedStoreId(forcedStoreId);
    }

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (isMultiStore && selectedStoreId) fetchAll();
  }, [selectedStoreId]);

  const selectStore = (id: string) => {
    localStorage.setItem("kat_active_store", id);
    setSelectedStoreId(id);
  };

  const createStore = async () => {
    if (!newStoreName.trim() || !user) return;
    const { data, error } = await supabase.from("stores").insert({ owner_id: user.id, name: newStoreName.trim() }).select().single();
    if (!error && data) {
      setStores((prev) => [...prev, data]);
      selectStore(data.id);
      setNewStoreName("");
      setShowAddStore(false);
    }
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
      <div className="min-h-screen flex items-center justify-center text-center p-6 gap-3 flex-col">
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

  const urlDebug = new URLSearchParams(window.location.search).get("debug") === "1";

  if (isMultiStore && !selectedStoreId && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        {urlDebug && (
          <div className="fixed top-0 left-0 right-0 bg-black text-white text-[10px] p-2 z-50 font-mono">
            isMultiStore: {String(isMultiStore)} | stores: {stores.length} | selectedStoreId: {selectedStoreId || "null"}
            {fetchError && <div className="text-red-400 mt-1">ERROR: {fetchError}</div>}
          </div>
        )}
        <div className="max-w-sm w-full text-center mb-8">
          <h1 className="text-xl font-black mb-1">Choose a Store</h1>
          <p className="text-sm text-muted-foreground">Select which store you want to manage</p>
        </div>
        <div className="max-w-sm w-full space-y-3">
          {stores.map((s) => {
            const pendingCount = storePendingCounts[s.id] || 0;
            return (
              <button
                key={s.id}
                onClick={() => selectStore(s.id)}
                className="relative w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-border bg-card hover:border-primary transition-all text-left"
              >
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-primary">{s.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-muted-foreground truncate">{s.description}</p>}
                </div>
              </button>
            );
          })}

          {showAddStore ? (
            <div className="p-4 rounded-2xl border-2 border-dashed border-primary/40 space-y-2">
              <Input placeholder="New store name" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} className="rounded-xl h-10 text-sm" />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 rounded-full" onClick={createStore}>Create Store</Button>
                <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setShowAddStore(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddStore(true)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all"
            >
              <Plus className="w-4 h-4" /> <span className="text-sm font-semibold">Add New Store</span>
            </button>
          )}
        </div>
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
    // NEW
    setAddStep(0); setSubcategory(""); setCategoryTouched(false);
    setAttributeValues({}); setExistingAttributes({});
    setAestheticsTouched(false); setSkuInput("");
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

    const rawVariants: any[] = Array.isArray(p.variants) ? p.variants : [];
    const normalizedVariants: ProductVariant[] = rawVariants.map((v: any) =>
      v.attributes
        ? { id: v.id || Math.random().toString(36).slice(2), attributes: v.attributes, sku: v.sku, price: v.price, stock: v.stock }
        : {
            id: v.id || Math.random().toString(36).slice(2),
            attributes: Object.fromEntries(
              Object.entries({ color: v.color, size: v.size, shoeSize: v.shoeSize }).filter(([, val]) => val)
            ) as Record<string, string>,
            sku: undefined,
            price: v.price !== undefined && v.price !== "" ? Number(v.price) : undefined,
            stock: v.stock !== undefined && v.stock !== "" ? Number(v.stock) : undefined,
          }
    );
    setVariants(normalizedVariants);
    setUseVariantPricing(Boolean(p.use_variant_pricing));
    setShowVariants(normalizedVariants.length > 0);
    setSelectedColors(Array.from(new Set(normalizedVariants.map((v) => v.attributes.color).filter(Boolean))) as string[]);
    setSelectedSizes(Array.from(new Set(normalizedVariants.map((v) => v.attributes.size).filter(Boolean))) as string[]);
    setSelectedShoeSizes(Array.from(new Set(normalizedVariants.map((v) => v.attributes.shoeSize).filter(Boolean))) as string[]);

    setCustomSizeNote(p.custom_size_note || "");
    setExistingColorImages(p.color_images || {});
    setColorImageFiles({}); setColorImagePreviews({});
    setUploadError(null);

    // NEW — preserve legacy category/aesthetics/attributes until seller explicitly changes them
    setAddStep(0);
    setSubcategory(p.attributes?.subcategory || "");
    setCategoryTouched(false);
    setExistingAttributes(p.attributes || {});
    setAttributeValues({
      audience: p.audience || "", fit: p.fit || "", length: p.length || "",
      material: p.material || "", occasion: p.occasion || "",
      ...Object.fromEntries(Object.entries(p.attributes || {}).filter(([k]) => k !== "subcategory")),
    });
    setAestheticsTouched(false);
    setSkuInput(p.sku || "");

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

  // NEW
  const handleCategorySelect = (cat: string, sub: string) => {
    setCategory(cat);
    setSubcategory(sub);
    setCategoryTouched(true);
    if (cat === "Thrift") setIsThrift(true);
  };

  const handleAttributeChange = (id: string, value: string) => {
    setAttributeValues((prev) => ({ ...prev, [id]: value }));
    if (id === "audience") setAudience(value);
    if (id === "fit") setFit(value);
    if (id === "length") setLength(value);
    if (id === "material") setMaterial(value);
    if (id === "occasion") setOccasion(value);
  };

  const generateVariants = () => {
    const newVariants: ProductVariant[] = [];
    const colors = selectedColors.length > 0 ? selectedColors : [undefined];
    const sizes = selectedSizes.length > 0 ? selectedSizes : [undefined];
    const shoeSizes = selectedShoeSizes.length > 0 ? selectedShoeSizes : [undefined];
    for (const color of colors) {
      for (const size of sizes) {
        for (const shoeSize of shoeSizes) {
          if (color || size || shoeSize) {
            const attrs = Object.fromEntries(
              Object.entries({ color, size, shoeSize }).filter(([, v]) => v)
            ) as Record<string, string>;
            const existing = variants.find(
              (v) => v.attributes.color === color && v.attributes.size === size && v.attributes.shoeSize === shoeSize
            );
            newVariants.push(
              existing || {
                id: Math.random().toString(36).slice(2),
                attributes: attrs,
                price: basePrice ? Number(basePrice) : undefined,
                stock: 10,
              }
            );
          }
        }
      }
    }
    setVariants(newVariants);
  };

  const updateVariant = (id: string, field: "price" | "stock" | "sku", value: number | string | undefined) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
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

  const saveProduct = async (status: "draft" | "published") => {
    if (status === "published") {
      if (!category) { setUploadError("Please select a category."); return; }
      if (existingImages.length + imageFiles.length === 0) { setUploadError("Please add at least one image."); return; }
      if (!title.trim() || !basePrice) { setUploadError("Please fill in title and price."); return; }
      if (!stockCount) { setUploadError("Please enter stock quantity."); return; }
      const requiredFields = getAttributeFieldsForSubcategory(subcategory).filter((f) => f.required);
      for (const f of requiredFields) {
        if (!attributeValues[f.id]) { setUploadError(`Please fill in ${f.label}.`); return; }
      }
    } else {
      if (!title.trim()) { setUploadError("Give your draft a name first."); return; }
    }

    setUploading(true); setUploadError(null);

    const newImageUrls = await uploadImages();
    const allImages = [...existingImages, ...newImageUrls];
    let videoUrl = existingVideoUrl;
    if (videoFile) videoUrl = await uploadVideo();
    const colorImages = await uploadColorImages();

    let imageEmbedding = null;
    if (allImages[0]) {
      try {
        const embedRes = await fetch("/api/generate-embedding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: allImages[0] }),
        });
        const embedData = await embedRes.json();
        if (embedRes.ok && Array.isArray(embedData.embedding)) {
          imageEmbedding = embedData.embedding;
        } else {
          console.error("Embedding generation failed:", embedData.error);
        }
      } catch (err) {
        console.error("Embedding request failed:", err);
      }
    }

    const payload: Record<string, any> = {
      title, description,
      audience: audience || null,
      fit: fit || null,
      length: length || null,
      material: material || null,
      occasion: occasion || null,
      seller_price: Number(basePrice) || null,
      price: basePrice ? Math.round(Number(basePrice) * 1.095) : null,
      image_url: allImages[0] || "",
      image_embedding: imageEmbedding,
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
      store_id: isMultiStore ? selectedStoreId : null,
      sku: skuInput.trim() || null,
      status,
      attributes: {
        ...existingAttributes,
        ...Object.fromEntries(
          Object.entries(attributeValues).filter(([k]) => !NATIVE_ATTRIBUTE_COLUMNS.has(k) && attributeValues[k])
        ),
        ...(subcategory ? { subcategory } : {}),
      },
    };

    if (!editingProductId || categoryTouched) payload.category = category;
    if (!editingProductId || aestheticsTouched) payload.aesthetics = selectedAesthetics.length > 0 ? selectedAesthetics : null;

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
          <div className="max-w-lg mx-auto px-4 pb-2">
            <StepProgress current={addStep} />
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-5">

          {addStep === 0 && (
            <CategoryStep
              category={category}
              subcategory={subcategory}
              isEditing={Boolean(editingProductId)}
              onSelect={handleCategorySelect}
            />
          )}

          {addStep === 1 && (
            <div className="space-y-5">
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
                <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl resize-none" rows={3} />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Vibes / Aesthetics</p>
                <div className="flex flex-wrap gap-2">
                  {CANONICAL_AESTHETICS.map(({ label, emoji }) => (
                    <button key={label} type="button"
                      onClick={() => {
                        setAestheticsTouched(true);
                        setSelectedAesthetics((prev) => prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${selectedAesthetics.includes(label) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>

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
            </div>
          )}

          {addStep === 2 && (
            <AttributesStep subcategory={subcategory} values={attributeValues} onChange={handleAttributeChange} />
          )}

          {addStep === 3 && (
            <div className="space-y-5">
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
            </div>
          )}

          {addStep === 4 && (
            <div className="space-y-4">
              <VariantsStep
                selectedColors={selectedColors}
                selectedSizes={selectedSizes}
                selectedShoeSizes={selectedShoeSizes}
                setSelectedColors={setSelectedColors}
                setSelectedSizes={setSelectedSizes}
                setSelectedShoeSizes={setSelectedShoeSizes}
                useVariantPricing={useVariantPricing}
                setUseVariantPricing={setUseVariantPricing}
                variants={variants}
                onGenerate={generateVariants}
                onUpdateVariant={updateVariant}
              />

              {selectedColors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Per-color images (optional)</p>
                  <div className="grid grid-cols-2 gap-2">
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
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Fit Notes (optional)</p>
                <Input placeholder='e.g. "Runs small, order up"' value={customSizeNote} onChange={(e) => setCustomSizeNote(e.target.value)} className="rounded-xl h-10 text-xs" />
              </div>
            </div>
          )}

          {addStep === 5 && (
            <div className="space-y-5">
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

              <Input placeholder="Stock quantity *" type="number" value={stockCount} onChange={(e) => setStockCount(e.target.value)} className="rounded-xl h-11" />
              <Input placeholder="SKU (optional)" value={skuInput} onChange={(e) => setSkuInput(e.target.value)} className="rounded-xl h-11" />

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

              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  🔒 Private Seller Note
                </p>
                <Textarea placeholder='Only visible to you. e.g. "Stored in box 3"' value={sellerNote} onChange={(e) => setSellerNote(e.target.value)} className="rounded-xl resize-none text-xs" rows={2} />
                <p className="text-[10px] text-muted-foreground">Buyers cannot see this note.</p>
              </div>
            </div>
          )}

          {addStep === 6 && (
            <ReviewStep
              data={{
                images: [...existingImages, ...imagePreviews],
                title, category, subcategory, description,
                attributes: attributeValues,
                variants,
                buyerPrice: basePrice ? Number(basePrice) * 1.095 : 0,
                stockCount,
                isThrift, thriftCondition,
              }}
            />
          )}

          {uploadError && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {uploadError}
            </div>
          )}

          <div className="flex gap-2">
            {addStep > 0 && (
              <Button type="button" variant="outline" className="rounded-full h-12 px-5" onClick={() => setAddStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {addStep < 6 ? (
              <Button type="button" className="flex-1 rounded-full h-12 font-bold" onClick={() => setAddStep((s) => s + 1)}>
                Continue
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" className="flex-1 rounded-full h-12 font-bold" disabled={uploading} onClick={() => saveProduct("draft")}>
                  Save Draft
                </Button>
                <Button type="button" className="flex-1 rounded-full h-12 font-bold" disabled={uploading} onClick={() => saveProduct("published")}>
                  {uploading ? "Saving..." : editingProductId ? "Save Changes" : "Publish Product"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
   }

  // ── MAIN DASHBOARD ──
  return (
    <div className="min-h-screen bg-background flex">

      {urlDebug && (
        <div className="fixed top-0 left-0 right-0 bg-black text-white text-[10px] p-2 z-50 font-mono">
          isMultiStore: {String(isMultiStore)} | stores: {stores.length} | selectedStoreId: {selectedStoreId || "null"} | loading: {String(loading)}
          {fetchError && <div className="text-red-400 mt-1">ERROR: {fetchError}</div>}
        </div>
      )}

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

        {isMultiStore && selectedStoreId && (
          <div className="p-3 border-b border-border">
            <button
              onClick={() => { localStorage.removeItem("kat_active_store"); setSelectedStoreId(null); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted hover:bg-accent transition-colors"
            >
              <div className="min-w-0 text-left">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Managing</p>
                <p className="text-xs font-bold truncate">{stores.find((s) => s.id === selectedStoreId)?.name || "Store"}</p>
              </div>
              <span className="text-[10px] font-semibold text-primary shrink-0 ml-2">Switch</span>
            </button>
          </div>
        )}

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
          <button
            onClick={() => { if (window.confirm("Sign out of KAT?")) signOut(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogIn className="w-4 h-4 rotate-180" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-lg font-black text-primary">KAT</span>
          </div>
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
      </div>

      {/* Mobile slide-in drawer — mirrors the desktop sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-card h-full flex flex-col shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-xl font-black text-primary">KAT</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Seller Center</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
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

            {isMultiStore && selectedStoreId && (
              <div className="p-3 border-b border-border">
                <button
                  onClick={() => { setMobileMenuOpen(false); localStorage.removeItem("kat_active_store"); setSelectedStoreId(null); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted hover:bg-accent transition-colors"
                >
                  <div className="min-w-0 text-left">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Managing</p>
                    <p className="text-xs font-bold truncate">{stores.find((s) => s.id === selectedStoreId)?.name || "Store"}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary shrink-0 ml-2">Switch</span>
                </button>
              </div>
            )}

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setSection(item.key); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${section === item.key ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {item.icon} {item.label}
                  {item.key === "orders" && pendingOrders.length > 0 && (
                    <span className="ml-auto bg-destructive text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingOrders.length}</span>
                  )}
                </button>
              ))}
            </nav>

            <div className="p-3 border-t border-border space-y-1">
              <Button size="sm" className="w-full rounded-xl gap-1 text-xs" onClick={() => { resetForm(); setShowUpload(true); setMobileMenuOpen(false); }}>
                <Plus className="w-3.5 h-3.5" /> Add Product
              </Button>
              <Link href="/me">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-all">
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back to KAT
                </button>
              </Link>
              <button
                onClick={() => { if (window.confirm("Sign out of KAT?")) signOut(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogIn className="w-4 h-4 rotate-180" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 md:pt-0 pt-16 pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6">

          {section === "home" && <SellerHomeSection user={user} products={products} orders={orders} pendingOrders={pendingOrders} toShip={toShip} incompleteProducts={incompleteProducts} revenue={revenue} onNavigate={setSection} loading={loading} onAddProduct={() => { resetForm(); setShowUpload(true); }} />}

          {section === "products" && <SellerProductsSection products={products} onEdit={openEdit} onDelete={deleteProduct} onAdd={() => { resetForm(); setShowUpload(true); }} />}

          {section === "orders" && <SellerOrdersSection orders={orders} products={products} onUpdateStatus={updateOrderStatus} />}

          {section === "promotions" && (
            <div className="text-center py-20">
              <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-bold text-sm">No active promotions</p>
              <p className="text-xs text-muted-foreground mt-1">Coupon and discount tools coming soon.</p>
            </div>
          )}

          {section === "statements" && <SellerStatementsSection orders={orders} revenue={revenue} />}

          {section === "settings" && <SellerSettingsSection user={user} isMultiStore={isMultiStore} activeStore={stores.find((s) => s.id === selectedStoreId)} onStoreUpdated={fetchAll} />}
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
function SellerOrdersSection({ orders, products, onUpdateStatus }: any) {
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
            const product = products.find((p: any) => p.id === o.product_id);
            const orderedColor = o.variant?.color;
            const orderedSize = o.variant?.size;
            const pickImage = (orderedColor && product?.color_images?.[orderedColor]) || product?.image_url;

            return (
              <div key={o.id} className="bg-card border border-card-border rounded-2xl p-4 space-y-3">

                {/* Pick card — what to grab off the shelf */}
                <div className="flex gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                  {pickImage ? (
                    <img src={pickImage} alt={product?.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{product?.title || "Product"}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {orderedColor && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Color: {orderedColor}</span>
                      )}
                      {orderedSize && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Size: {orderedSize}</span>
                      )}
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted">Qty: {o.quantity || 1}</span>
                    </div>
                  </div>
                </div>

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
                    {SELLER_CONTROLLED_STATUSES.map((s, i) => {
                      const currentIndex = SELLER_CONTROLLED_STATUSES.indexOf(status);
                      const isDone = currentIndex >= 0 && i <= currentIndex;
                      const isNext = i === currentIndex + 1 || (status === "pending" && i === 0);
                      const clickable = isNext;
                      return (
                        <button
                          key={s}
                          disabled={!clickable}
                          onClick={() => clickable && onUpdateStatus(o.id, s)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                            isDone
                              ? "bg-primary text-primary-foreground border-primary"
                              : clickable
                                ? "border-primary text-primary hover:bg-primary/5"
                                : "border-border text-muted-foreground/40 cursor-not-allowed"
                          }`}>
                          {isDone ? "✓ " : ""}{ORDER_STATUS_CONFIG[s].label}
                        </button>
                      );
                    })}
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
function SellerSettingsSection({ user, isMultiStore, activeStore, onStoreUpdated }: any) {
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (isMultiStore) {
      setStoreName(activeStore?.name || "");
      setStoreDescription(activeStore?.description || "");
      return;
    }
    supabase.from("profiles").select("store_name, store_description").eq("id", user.id).single().then(({ data, error }) => {
      if (error) { console.error("STORE SETTINGS LOAD FAILED:", error); return; }
      if (data) {
        setStoreName(data.store_name || "");
        setStoreDescription(data.store_description || "");
      }
    });
  }, [user.id, isMultiStore, activeStore?.id]);

  const saveSettings = async () => {
    setSaving(true);
    setSaveError("");

    const { error } = isMultiStore
      ? await supabase.from("stores").update({ name: storeName, description: storeDescription }).eq("id", activeStore.id)
      : await supabase.from("profiles").update({ store_name: storeName, store_description: storeDescription }).eq("id", user.id);

    setSaving(false);
    if (error) {
      console.error("STORE SETTINGS SAVE FAILED:", error);
      setSaveError("Failed to save: " + error.message);
      return;
    }
    setSaved(true);
    if (isMultiStore && onStoreUpdated) onStoreUpdated();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black">
        {isMultiStore ? `${activeStore?.name || "Store"} Settings` : "Store Settings"}
      </h2>
      <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" /> Store Info
        </p>
        <Input placeholder="Store name" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="rounded-xl h-11" />
        <Textarea placeholder="Store description (visible to buyers on your store page)" value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} className="rounded-xl resize-none" rows={3} />
        <Button className="rounded-full w-full" onClick={saveSettings} disabled={saving}>
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Settings"}
        </Button>
        {saveError && <p className="text-xs text-destructive font-medium">{saveError}</p>}
      </div>
    </div>
  );
            }

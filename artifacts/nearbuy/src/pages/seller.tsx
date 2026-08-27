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
import type { ProductVariant } from "@/lib/product-variants";
import { NATIVE_ATTRIBUTE_COLUMNS } from "@/lib/product-attributes";
import { THRIFT_DEFAULT_STOCK } from "@/lib/thrift-config";
import { SELLER_CATEGORY_TO_TOP_CATEGORIES, type SellerCategoryId } from "@/lib/seller-categories";
import SellerCategoryGate from "@/components/seller/add-product/SellerCategoryGate";
import AddProductComposer from "@/components/seller/add-product/AddProductComposer";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

type SellerSection = "home" | "products" | "orders" | "promotions" | "statements" | "settings";

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

  const [profileSellerCategory, setProfileSellerCategory] = useState<SellerCategoryId | null | undefined>(undefined);
  const [savingSellerCategory, setSavingSellerCategory] = useState(false);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [selectedAesthetics, setSelectedAesthetics] = useState<string[]>([]);
  const [aestheticsTouched, setAestheticsTouched] = useState(false);
  const [audience, setAudience] = useState("");
  const [fit, setFit] = useState("");
  const [material, setMaterial] = useState("");
  const [occasion, setOccasion] = useState("");
  const [color, setColor] = useState("");
  const [colorTouched, setColorTouched] = useState(false);
  const [size, setSize] = useState("");
  const [sizeTouched, setSizeTouched] = useState(false);
  const [brand, setBrand] = useState("");
  const [electronicsCondition, setElectronicsCondition] = useState("");
  const [warranty, setWarranty] = useState("");
  const [shadeType, setShadeType] = useState("");
  const [volumeSize, setVolumeSize] = useState("");
  const [powerSource, setPowerSource] = useState("");
  const [adjustable, setAdjustable] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState("");
  const [isThrift, setIsThrift] = useState(false);
  const [thriftCondition, setThriftCondition] = useState("");
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
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedShoeSizes, setSelectedShoeSizes] = useState<string[]>([]);
  const [existingAttributes, setExistingAttributes] = useState<Record<string, any>>({});
  const [stockCount, setStockCount] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles").select("is_multi_store, seller_category").eq("id", user.id).single();
      if (profileError) throw new Error("profile: " + profileError.message);

      const multiStore = Boolean(profileData?.is_multi_store);
      setIsMultiStore(multiStore);
      setProfileSellerCategory((profileData?.seller_category as SellerCategoryId) ?? null);

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

  const activeStore = isMultiStore ? stores.find((s) => s.id === selectedStoreId) : null;
  const sellerCategory: SellerCategoryId | null | undefined = isMultiStore
    ? (activeStore ? ((activeStore.seller_category as SellerCategoryId) ?? null) : undefined)
    : profileSellerCategory;

  const handleSellerCategorySelect = async (catId: SellerCategoryId) => {
    setSavingSellerCategory(true);
    if (isMultiStore && selectedStoreId) {
      const { error } = await supabase.from("stores").update({ seller_category: catId }).eq("id", selectedStoreId);
      if (!error) setStores((prev) => prev.map((s) => (s.id === selectedStoreId ? { ...s, seller_category: catId } : s)));
      else console.error("Failed to save store seller_category:", error.message);
    } else {
      const { error } = await supabase.from("profiles").update({ seller_category: catId }).eq("id", user.id);
      if (!error) setProfileSellerCategory(catId);
      else console.error("Failed to save profile seller_category:", error.message);
    }
    setSavingSellerCategory(false);
  };

  const revenue = orders.reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const pendingOrders = orders.filter((o) => (o.admin_status || "pending") === "pending");
  const toShip = orders.filter((o) => o.admin_status === "preparing" || o.admin_status === "accepted");
  const incompleteProducts = products.filter((p) => !p.title || !p.price || !p.image_url);

  const resetForm = () => {
    setEditingProductId(null); setTitle(""); setBasePrice(""); setDescription("");
    setCategory(""); setDepartment(""); setSubcategory(""); setCategoryTouched(false);
    setSelectedAesthetics([]); setAestheticsTouched(false);
    setIsThrift(false); setThriftCondition("");
    setPackageSize(""); setSellerNote(""); setStockCount("");
    setAudience(""); setFit(""); setMaterial(""); setOccasion(""); setAiError("");
    setColor(""); setColorTouched(false); setSize(""); setSizeTouched(false);
    setBrand(""); setElectronicsCondition(""); setWarranty("");
    setShadeType(""); setVolumeSize(""); setPowerSource(""); setAdjustable("");
    setExpiryDate(""); setDimensions("");
    setImageFiles([]); setImagePreviews([]); setExistingImages([]);
    setVideoFile(null); setVideoPreview(""); setExistingVideoUrl("");
    setVariants([]); setSelectedColors([]); setSelectedSizes([]); setSelectedShoeSizes([]);
    setUseVariantPricing(false);
    setExistingAttributes({});
    setUploadError(null);
  };

  const openAddProduct = () => {
    resetForm();
    if (sellerCategory === "Thrift") setStockCount(THRIFT_DEFAULT_STOCK);
    setShowUpload(true);
  };

  const openEdit = (p: any) => {
    setEditingProductId(p.id);
    setTitle(p.title || ""); setBasePrice(String(p.seller_price ?? p.price ?? "")); setDescription(p.description || "");
    setCategory(p.category || "");
    setDepartment(["Woman", "Men", "Kids"].includes(p.category) ? p.category : "");
    setSubcategory(p.attributes?.subcategory || "");
    setCategoryTouched(false);
    setSelectedAesthetics(p.aesthetics || []);
    setAestheticsTouched(false);
    setAudience(p.audience || ""); setFit(p.fit || ""); setMaterial(p.material || ""); setOccasion(p.occasion || "");
    setColor((p.colors && p.colors[0]) || p.attributes?.color || "");
    setColorTouched(false);
    setSize((p.clothing_sizes && p.clothing_sizes[0]) || p.attributes?.size || "");
    setSizeTouched(false);
    setBrand(p.attributes?.brand || "");
    setElectronicsCondition(p.attributes?.condition || "");
    setWarranty(p.attributes?.warranty || "");
    setShadeType(p.attributes?.shade_type || "");
    setVolumeSize(p.attributes?.volume_size || "");
    setPowerSource(p.attributes?.power_source || "");
    setAdjustable(p.attributes?.adjustable || "");
    setExpiryDate(p.attributes?.expiry_date || "");
    setDimensions(p.attributes?.dimensions || "");
    setIsThrift(Boolean(p.is_thrift)); setThriftCondition(p.thrift_condition || "");
    setPackageSize(p.package_size || "");
    setSellerNote(p.seller_note || ""); setStockCount(String(p.stock_count ?? ""));
    setExistingImages(Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []));
    setImageFiles([]); setImagePreviews([]);
    setExistingVideoUrl(p.video_url || ""); setVideoFile(null); setVideoPreview("");

    const rawVariants: any[] = Array.isArray(p.variants) ? p.variants : [];
    const normalizedVariants: ProductVariant[] = rawVariants.map((v: any) =>
      v.attributes
        ? { id: v.id || Math.random().toString(36).slice(2), attributes: v.attributes, price: v.price, stock: v.stock }
        : {
            id: v.id || Math.random().toString(36).slice(2),
            attributes: Object.fromEntries(
              Object.entries({ color: v.color, size: v.size, shoeSize: v.shoeSize }).filter(([, val]) => val)
            ) as Record<string, string>,
            price: v.price !== undefined && v.price !== "" ? Number(v.price) : undefined,
            stock: v.stock !== undefined && v.stock !== "" ? Number(v.stock) : undefined,
          }
    );
    setVariants(normalizedVariants);
    setUseVariantPricing(Boolean(p.use_variant_pricing));
    setSelectedColors(Array.from(new Set(normalizedVariants.map((v) => v.attributes.color).filter(Boolean))) as string[]);
    setSelectedSizes(Array.from(new Set(normalizedVariants.map((v) => v.attributes.size).filter(Boolean))) as string[]);
    setSelectedShoeSizes(Array.from(new Set(normalizedVariants.map((v) => v.attributes.shoeSize).filter(Boolean))) as string[]);

    setExistingAttributes(p.attributes || {});
    setUploadError(null);
    setShowUpload(true);
  };

  const handleImageSelect = (files: File[]) => {
    const remaining = 8 - (imageFiles.length + existingImages.length);
    const newFiles = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
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
    const newVariants: ProductVariant[] = [];
    const colors = selectedColors.length > 0 ? selectedColors : [undefined];
    const sizes = selectedSizes.length > 0 ? selectedSizes : [undefined];
    const shoeSizes = selectedShoeSizes.length > 0 ? selectedShoeSizes : [undefined];
    for (const c of colors) {
      for (const s of sizes) {
        for (const ss of shoeSizes) {
          if (c || s || ss) {
            const attrs = Object.fromEntries(
              Object.entries({ color: c, size: s, shoeSize: ss }).filter(([, v]) => v)
            ) as Record<string, string>;
            const existing = variants.find(
              (v) => v.attributes.color === c && v.attributes.size === s && v.attributes.shoeSize === ss
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

  const updateVariant = (id: string, field: "price" | "stock", value: number | undefined) => {
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
          category: department || category, audience, fit, material, occasion,
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

  const resolveCategory = (): string => {
    if (!sellerCategory) return category;
    if (sellerCategory === "Thrift") return "Thrift";
    if (sellerCategory === "Fashion") return department;
    return SELLER_CATEGORY_TO_TOP_CATEGORIES[sellerCategory][0] || category;
  };

  const saveProduct = async (status: "draft" | "published") => {
    const resolvedCategory = resolveCategory();

    if (status === "published") {
      if (!resolvedCategory) { setUploadError("Please select what you're listing."); return; }
      if (!subcategory) { setUploadError("Please select what you're listing."); return; }
      if (existingImages.length + imageFiles.length === 0) { setUploadError("Please add at least one photo."); return; }
      if (!title.trim() || !basePrice) { setUploadError("Please fill in title and price."); return; }
      if (!stockCount) { setUploadError("Please enter stock quantity."); return; }
      if (sellerCategory === "Thrift" && !thriftCondition) { setUploadError("Please select the item's condition."); return; }
    } else {
      if (!title.trim()) { setUploadError("Give your draft a name first."); return; }
    }

    setUploading(true); setUploadError(null);

    const newImageUrls = await uploadImages();
    const allImages = [...existingImages, ...newImageUrls];
    let videoUrl = existingVideoUrl;
    if (videoFile) videoUrl = await uploadVideo();

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

    const attributeValues: Record<string, string> = {
      audience, fit, material, occasion,
      color, size, brand,
      condition: electronicsCondition,
      warranty, shade_type: shadeType, volume_size: volumeSize,
      power_source: powerSource, adjustable,
      expiry_date: expiryDate, dimensions,
    };

    const isNewThrift = sellerCategory === "Thrift";

    const payload: Record<string, any> = {
      title, description,
      audience: audience || null,
      fit: fit || null,
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
      is_thrift: isNewThrift,
      thrift_condition: isNewThrift && thriftCondition ? thriftCondition : null,
      package_size: packageSize || null,
      seller_note: sellerNote.trim() || null,
      stock_count: stockCount ? Number(stockCount) : null,
      in_stock: true,
      seller_id: user.id,
      seller_name: user.name || user.email,
      store_id: isMultiStore ? selectedStoreId : null,
      status,
      attributes: {
        ...existingAttributes,
        ...Object.fromEntries(
          Object.entries(attributeValues).filter(([k, v]) => !NATIVE_ATTRIBUTE_COLUMNS.has(k) && v)
        ),
        ...(subcategory ? { subcategory } : {}),
      },
    };

    if (!editingProductId || categoryTouched) payload.category = resolvedCategory;
    if (!editingProductId || aestheticsTouched) payload.aesthetics = selectedAesthetics.length > 0 ? selectedAesthetics : null;
    if (!editingProductId || colorTouched) payload.colors = color ? [color] : null;
    if (!editingProductId || sizeTouched) payload.clothing_sizes = size ? [size] : null;

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

  // ── ADD/EDIT PRODUCT ──
  if (showUpload) {
    if (sellerCategory === undefined) {
      return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading...</div>;
    }
    if (sellerCategory === null) {
      return <SellerCategoryGate onSelect={handleSellerCategorySelect} saving={savingSellerCategory} />;
    }
    return (
      <AddProductComposer
        sellerCategory={sellerCategory}
        isEditing={Boolean(editingProductId)}
        onBack={() => { setShowUpload(false); resetForm(); }}
        existingImages={existingImages}
        imagePreviews={imagePreviews}
        onAddImages={handleImageSelect}
        onRemoveExistingImage={(i) => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))}
        onRemoveNewImage={(i) => { setImageFiles((prev) => prev.filter((_, idx) => idx !== i)); setImagePreviews((prev) => prev.filter((_, idx) => idx !== i)); }}
        videoPreview={videoPreview}
        existingVideoUrl={existingVideoUrl}
        onAddVideo={(f) => { setVideoFile(f); setVideoPreview(URL.createObjectURL(f)); setExistingVideoUrl(""); }}
        onRemoveVideo={() => { setVideoFile(null); setVideoPreview(""); setExistingVideoUrl(""); }}
        title={title} onTitleChange={setTitle}
        description={description} onDescriptionChange={setDescription}
        showAIGenerate={sellerCategory !== "Thrift"}
        onGenerateAI={sellerCategory !== "Thrift" ? generateWithAI : undefined}
        generatingAI={generatingAI}
        aiError={aiError}
        department={department} onDepartmentChange={(v) => { setDepartment(v); setCategoryTouched(true); }}
        subcategory={subcategory} onSubcategoryChange={(v) => { setSubcategory(v); setCategoryTouched(true); }}
        color={color} onColorChange={(v) => { setColor(v); setColorTouched(true); }}
        size={size} onSizeChange={(v) => { setSize(v); setSizeTouched(true); }}
        fit={fit} onFitChange={setFit}
        material={material} onMaterialChange={setMaterial}
        occasion={occasion} onOccasionChange={setOccasion}
        audience={audience} onAudienceChange={setAudience}
        aesthetics={selectedAesthetics} onAestheticsChange={(v) => { setSelectedAesthetics(v); setAestheticsTouched(true); }}
        brand={brand} onBrandChange={setBrand}
        thriftCondition={thriftCondition} onThriftConditionChange={setThriftCondition}
        electronicsCondition={electronicsCondition} onElectronicsConditionChange={setElectronicsCondition}
        warranty={warranty} onWarrantyChange={setWarranty}
        shadeType={shadeType} onShadeTypeChange={setShadeType}
        volumeSize={volumeSize} onVolumeSizeChange={setVolumeSize}
        powerSource={powerSource} onPowerSourceChange={setPowerSource}
        adjustable={adjustable} onAdjustableChange={setAdjustable}
        selectedColors={selectedColors} setSelectedColors={setSelectedColors}
        selectedSizes={selectedSizes} setSelectedSizes={setSelectedSizes}
        selectedShoeSizes={selectedShoeSizes} setSelectedShoeSizes={setSelectedShoeSizes}
        useVariantPricing={useVariantPricing} setUseVariantPricing={setUseVariantPricing}
        variants={variants}
        onGenerateVariants={generateVariants}
        onUpdateVariant={updateVariant}
        price={basePrice} onPriceChange={setBasePrice}
        stock={stockCount} onStockChange={setStockCount}
        sellerNote={sellerNote} onSellerNoteChange={setSellerNote}
        packageSize={packageSize} onPackageSizeChange={setPackageSize}
        expiryDate={expiryDate} onExpiryDateChange={setExpiryDate}
        dimensions={dimensions} onDimensionsChange={setDimensions}
        uploadError={uploadError}
        uploading={uploading}
        onSaveDraft={() => saveProduct("draft")}
        onPublish={() => saveProduct("published")}
      />
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

      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground text-sm font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <Bell className="w-4 h-4" /> New order received! 🎉
        </div>
      )}

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
          <Button size="sm" className="w-full rounded-xl gap-1 text-xs" onClick={openAddProduct}>
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
            <button onClick={openAddProduct} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
            <button onClick={fetchAll} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

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
              <Button size="sm" className="w-full rounded-xl gap-1 text-xs" onClick={() => { openAddProduct(); setMobileMenuOpen(false); }}>
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

      <main className="flex-1 min-w-0 md:pt-0 pt-16 pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6">

          {section === "home" && <SellerHomeSection user={user} products={products} orders={orders} pendingOrders={pendingOrders} toShip={toShip} incompleteProducts={incompleteProducts} revenue={revenue} onNavigate={setSection} loading={loading} onAddProduct={openAddProduct} />}

          {section === "products" && <SellerProductsSection products={products} onEdit={openEdit} onDelete={deleteProduct} onAdd={openAddProduct} />}

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

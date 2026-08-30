import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import {
  Home, Package, ShoppingCart, Megaphone, Wallet, Store as StoreIcon,
  LogIn, Lock, Plus, Bell, ChevronRight, AlertCircle,
  RefreshCw, Pencil, Copy, Trash2, X, ChevronDown, ChevronUp,
  BarChart2, BadgeCheck, Menu, Search, Info,
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

// Translates raw Postgres/Supabase error messages into seller-friendly text.
// Sellers should never see raw database error strings (constraint names,
// column names, SQL internals) — this is the single place that decides what
// gets shown instead.
function friendlyError(error: any, fallback = "Something went wrong. Please try again."): string {
  const msg = (error?.message || "").toLowerCase();
  if (!msg) return fallback;
  if (msg.includes("not-null constraint") || msg.includes("null value in column")) {
    return "Something required is still missing — please check the highlighted fields and try again.";
  }
  if (msg.includes("duplicate key")) {
    return "This looks like it's already been saved. Try refreshing the page.";
  }
  if (msg.includes("permission denied") || msg.includes("row-level security")) {
    return "You don't have permission to do that. Please try signing out and back in.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network issue — please check your connection and try again.";
  }
  return fallback;
}

// ── Order aging / date helpers (pure functions over existing order_events / created_at — no new backend) ──
function ageLabel(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const hrs = ms / (1000 * 60 * 60);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${Math.floor(hrs)}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function isSameDayOrAfter(dateStr: string, daysAgo: number): boolean {
  const cutoff = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(dateStr).getTime() >= cutoff;
}

type SellerSection = "home" | "products" | "orders" | "analytics" | "promotions" | "earnings" | "store";

const SELLER_CONTROLLED_STATUSES = ["accepted", "preparing", "ready_for_pickup"];

const ORDER_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:          { label: "Pending",          className: "bg-muted text-foreground" },
  accepted:         { label: "Accepted",         className: "bg-muted text-foreground" },
  preparing:        { label: "Preparing",        className: "bg-muted text-foreground" },
  ready_for_pickup: { label: "Ready for Pickup", className: "bg-muted text-foreground" },
  out_for_delivery: { label: "Out for Delivery", className: "bg-muted text-foreground" },
  delivered:        { label: "Delivered",        className: "bg-muted text-muted-foreground" },
  completed:        { label: "Completed",        className: "bg-muted text-muted-foreground" },
  cancelled:        { label: "Cancelled",        className: "bg-muted text-muted-foreground" },
};

const NAV_ITEMS: { key: SellerSection; label: string; icon: React.ReactNode }[] = [
  { key: "home",       label: "Home",       icon: <Home className="w-4 h-4" /> },
  { key: "products",   label: "Products",   icon: <Package className="w-4 h-4" /> },
  { key: "orders",     label: "Orders",     icon: <ShoppingCart className="w-4 h-4" /> },
  { key: "analytics",  label: "Analytics",  icon: <BarChart2 className="w-4 h-4" /> },
  { key: "promotions", label: "Promotions", icon: <Megaphone className="w-4 h-4" /> },
  { key: "earnings",   label: "Earnings",   icon: <Wallet className="w-4 h-4" /> },
  { key: "store",      label: "Store",      icon: <StoreIcon className="w-4 h-4" /> },
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [stores, setStores] = useState<any[]>([]);
  const [isMultiStore, setIsMultiStore] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [storePendingCounts, setStorePendingCounts] = useState<Record<string, number>>({});
  const [addStoreError, setAddStoreError] = useState<string | null>(null);

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

  // NOTE: fetchAll, the realtime subscription, multi-store selection, store
  // creation, seller-category handling, all product CRUD (openAddProduct,
  // openEdit, saveProduct, deleteProduct), and updateOrderStatus below are
  // UNCHANGED from the existing implementation — same queries, same payload
  // shapes, same state machine. Only the presentational sections after the
  // "MAIN DASHBOARD" comment are new.

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
      setFetchError(friendlyError(err, "Couldn't load your seller data. Please try refreshing the page."));
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
    setAddStoreError(null);
    const { data, error } = await supabase.from("stores").insert({ owner_id: user.id, name: newStoreName.trim() }).select().single();
    if (!error && data) {
      setStores((prev) => [...prev, data]);
      selectStore(data.id);
      setNewStoreName("");
      setShowAddStore(false);
    } else {
      setAddStoreError(friendlyError(error, "Couldn't create the store. Please try again."));
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
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center shadow">
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
              {addStoreError && <p className="text-xs text-destructive font-medium">{addStoreError}</p>}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 rounded-full" onClick={createStore}>Create Store</Button>
                <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { setShowAddStore(false); setAddStoreError(null); }}>Cancel</Button>
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

  // ── Derived data (all computed client-side from existing orders/products — no new backend) ──
  const revenue = orders.reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const pendingOrders = orders.filter((o) => (o.admin_status || "pending") === "pending");
  const toShip = orders.filter((o) => o.admin_status === "preparing" || o.admin_status === "accepted");
  const handedOffOrders = orders.filter((o) => ["out_for_delivery", "delivered", "completed"].includes(o.admin_status));
  const cancelledOrders = orders.filter((o) => o.admin_status === "cancelled");
  const cancellationRate = orders.length > 0 ? (cancelledOrders.length / orders.length) * 100 : 0;

  const incompleteProducts = products.filter((p) => !p.title || !p.price || !p.image_url);
  const draftProducts = products.filter((p) => p.status === "draft");
  const lowStockProducts = products.filter((p) => p.in_stock !== false && typeof p.stock_count === "number" && p.stock_count > 0 && p.stock_count <= 3);
  const outOfStockProducts = products.filter((p) => p.in_stock === false || p.stock_count === 0);

  const ordersThisWeek = orders.filter((o) => isSameDayOrAfter(o.created_at, 7));
  const ordersLastWeek = orders.filter((o) => !isSameDayOrAfter(o.created_at, 7) && isSameDayOrAfter(o.created_at, 14));
  const revenueThisWeek = ordersThisWeek.reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const netEarningsThisWeek = revenueThisWeek / 1.095;
  const weekOverWeekChange = ordersLastWeek.length > 0
    ? Math.round(((ordersThisWeek.length - ordersLastWeek.length) / ordersLastWeek.length) * 100)
    : null;

  // Best-selling products this week — derived from orders joined to products, no new schema.
  const salesByProduct: Record<string, { title: string; unitsSold: number; revenue: number; lastSoldAt: string }> = {};
  orders.forEach((o) => {
    const p = products.find((pr) => pr.id === o.product_id);
    if (!p) return;
    const key = p.id;
    if (!salesByProduct[key]) salesByProduct[key] = { title: p.title, unitsSold: 0, revenue: 0, lastSoldAt: o.created_at };
    salesByProduct[key].unitsSold += o.quantity || 1;
    salesByProduct[key].revenue += o.total || o.amount || 0;
    if (new Date(o.created_at) > new Date(salesByProduct[key].lastSoldAt)) salesByProduct[key].lastSoldAt = o.created_at;
  });
  const bestSellers = Object.values(salesByProduct).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 3);
  const dormantProducts = products.filter((p) => {
    const sale = salesByProduct[p.id];
    if (!sale) return true; // never sold
    return !isSameDayOrAfter(sale.lastSoldAt, 60);
  }).slice(0, 3);

  const bestSellerLowStock = bestSellers.find((b) => {
    const prod = products.find((p) => p.title === b.title);
    return prod && (prod.stock_count ?? 99) <= 3 && prod.in_stock !== false;
  });

  // Store completeness — computed from existing fields only.
  const activeStoreForCompleteness = isMultiStore ? stores.find((s) => s.id === selectedStoreId) : null;
  const storeName = isMultiStore ? activeStoreForCompleteness?.name : user.storeName;
  const storeDescription = isMultiStore ? activeStoreForCompleteness?.description : user.storeDescription;
  const completenessChecks = [
    { label: "Store name added", done: Boolean(storeName) },
    { label: "Store description added", done: Boolean(storeDescription) },
    { label: "At least one product listed", done: products.length > 0 },
  ];
  const completenessPct = Math.round((completenessChecks.filter((c) => c.done).length / completenessChecks.length) * 100);

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
      setAiError("AI generation failed, please try again.");
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

    // NOTE: products.price is NOT NULL in the schema — even a draft with no
    // price entered yet must send a numeric value, never null, or the insert/
    // update throws a raw Postgres "not-null constraint" error straight to
    // the seller. Defaulting to 0 keeps drafts saveable without a price.
    const payload: Record<string, any> = {
      title, description,
      audience: audience || null,
      fit: fit || null,
      material: material || null,
      occasion: occasion || null,
      seller_price: Number(basePrice) || null,
      price: basePrice ? Math.round(Number(basePrice) * 1.095) : 0,
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
      else {
        console.error("PRODUCT UPDATE FAILED:", error);
        setUploadError(friendlyError(error, "Couldn't save your changes. Please try again."));
      }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().single();
      setUploading(false);
      if (!error && data) { setProducts((prev) => [data, ...prev]); setShowUpload(false); resetForm(); }
      else {
        console.error("PRODUCT INSERT FAILED:", error);
        setUploadError(friendlyError(error, "Couldn't save this product. Please try again."));
      }
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("PRODUCT DELETE FAILED:", error);
      alert(friendlyError(error, "Couldn't delete this product. Please try again."));
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Duplicate product — approved as a launch-adjacent capability, trivial
  // against the existing schema (copy the row, drop id/timestamps, force
  // draft status so a duplicate never goes live silently).
  const duplicateProduct = async (p: any) => {
    const { id, created_at, updated_at, ...rest } = p;
    const payload = { ...rest, title: `${p.title} (copy)`, status: "draft" };
    const { data, error } = await supabase.from("products").insert(payload).select().single();
    if (!error && data) {
      setProducts((prev) => [data, ...prev]);
    } else {
      console.error("PRODUCT DUPLICATE FAILED:", error);
      alert(friendlyError(error, "Couldn't duplicate this product. Please try again."));
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ admin_status: status, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) {
      console.error("SELLER STATUS UPDATE FAILED:", error);
      alert(friendlyError(error, "Couldn't update this order's status. Please try again."));
      return;
    }
    await supabase.from("order_events").insert({ order_id: orderId, status });
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, admin_status: status } : o));
  };

  // ── ADD/EDIT PRODUCT ── (untouched)
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

  // ── MAIN SELLER CENTER ──
  const notifications = [
    ...pendingOrders.slice(0, 3).map((o) => ({
      icon: <ShoppingCart className="w-3.5 h-3.5" />,
      text: `New order ${o.buyer_name ? "from " + o.buyer_name : "#" + o.id.slice(0, 8)}`,
      time: ageLabel(o.created_at),
    })),
    ...outOfStockProducts.slice(0, 2).map((p) => ({
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      text: `${p.title} is out of stock`,
      time: "",
    })),
  ];

  return (
    <div className="min-h-screen bg-background flex">

      {urlDebug && (
        <div className="fixed top-0 left-0 right-0 bg-black text-white text-[10px] p-2 z-50 font-mono">
          isMultiStore: {String(isMultiStore)} | stores: {stores.length} | selectedStoreId: {selectedStoreId || "null"} | loading: {String(loading)}
          {fetchError && <div className="text-red-400 mt-1">ERROR: {fetchError}</div>}
        </div>
      )}

      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 bg-foreground text-background text-sm font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <Bell className="w-4 h-4" /> New order received
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="w-60 shrink-0 bg-card border-r border-border min-h-screen sticky top-0 hidden md:flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/"><span className="text-xl font-black text-primary cursor-pointer">KAT</span></Link>
          <p className="text-[10px] text-muted-foreground mt-0.5">Seller Center</p>
        </div>

        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-primary">{(user.name || user.email || "KA").slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{user.name || "Seller"}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              </div>
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${section === item.key ? "bg-muted text-foreground font-bold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {item.icon} {item.label}
              {item.key === "orders" && pendingOrders.length > 0 && (
                <span className="ml-auto bg-foreground text-background text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingOrders.length}</span>
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

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-lg font-black text-primary">KAT</span>
          </div>
          <p className="text-xs font-semibold">Seller Center</p>
          <div className="flex gap-1 items-center relative">
            <button onClick={() => setNotifOpen((v) => !v)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center relative">
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-foreground" />}
            </button>
            <button onClick={openAddProduct} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
            <button onClick={fetchAll} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </button>
            {notifOpen && <NotificationDropdown notifications={notifications} onClose={() => setNotifOpen(false)} />}
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${section === item.key ? "bg-muted text-foreground font-bold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {item.icon} {item.label}
                  {item.key === "orders" && pendingOrders.length > 0 && (
                    <span className="ml-auto bg-foreground text-background text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingOrders.length}</span>
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
        {/* Desktop top bar with notification bell */}
        <div className="hidden md:flex justify-end px-6 pt-4 relative">
          <button onClick={() => setNotifOpen((v) => !v)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center relative">
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-foreground" />}
          </button>
          {notifOpen && <NotificationDropdown notifications={notifications} onClose={() => setNotifOpen(false)} />}
        </div>

        <div className="max-w-5xl mx-auto px-4 py-4">

          {section === "home" && (
            <SellerHomeSection
              user={user}
              loading={loading}
              products={products}
              orders={orders}
              pendingOrders={pendingOrders}
              incompleteProducts={incompleteProducts}
              draftProducts={draftProducts}
              lowStockProducts={lowStockProducts}
              outOfStockProducts={outOfStockProducts}
              ordersThisWeek={ordersThisWeek}
              revenueThisWeek={revenueThisWeek}
              netEarningsThisWeek={netEarningsThisWeek}
              weekOverWeekChange={weekOverWeekChange}
              bestSellers={bestSellers}
              dormantProducts={dormantProducts}
              bestSellerLowStock={bestSellerLowStock}
              cancellationRate={cancellationRate}
              completenessPct={completenessPct}
              onNavigate={setSection}
              onAddProduct={openAddProduct}
            />
          )}

          {section === "products" && (
            <SellerProductsSection
              products={products}
              onEdit={openEdit}
              onDelete={deleteProduct}
              onDuplicate={duplicateProduct}
              onAdd={openAddProduct}
            />
          )}

          {section === "orders" && (
            <SellerOrdersSection
              orders={orders}
              products={products}
              cancellationRate={cancellationRate}
              onUpdateStatus={updateOrderStatus}
            />
          )}

          {section === "analytics" && (
            <SellerAnalyticsSection
              orders={orders}
              products={products}
              salesByProduct={salesByProduct}
              cancellationRate={cancellationRate}
            />
          )}

          {section === "promotions" && <SellerPromotionsSection />}

          {section === "earnings" && <SellerEarningsSection orders={orders} revenue={revenue} />}

          {section === "store" && (
            <SellerStoreSection
              user={user}
              isMultiStore={isMultiStore}
              activeStore={stores.find((s) => s.id === selectedStoreId)}
              completenessChecks={completenessChecks}
              completenessPct={completenessPct}
              onStoreUpdated={fetchAll}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ── NOTIFICATION BELL DROPDOWN ──
// Presentation-only over existing real-time order data + computed stock
// alerts. No new backend — this is not a persistent notification history,
// it's a live-computed list from data already in memory. A true persistent
// notification log (surviving reload with read/unread state) would need a
// new table and is flagged in the product spec as "soon", not built here.
function NotificationDropdown({ notifications, onClose }: any) {
  return (
    <div className="absolute top-12 right-0 w-72 bg-card border border-border rounded-2xl shadow-xl z-50 p-2">
      <div className="flex items-center justify-between px-2 py-1">
        <p className="text-xs font-bold text-muted-foreground">Notifications</p>
        <button onClick={onClose} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
      {notifications.length === 0 ? (
        <p className="text-xs text-muted-foreground px-2 py-4 text-center">You're all caught up.</p>
      ) : (
        <div className="space-y-0.5 mt-1">
          {notifications.map((n: any, i: number) => (
            <div key={i} className="flex items-start gap-2 px-2 py-2 rounded-xl hover:bg-muted transition-colors">
              <span className="text-muted-foreground mt-0.5">{n.icon}</span>
              <div className="min-w-0">
                <p className="text-xs">{n.text}</p>
                {n.time && <p className="text-[10px] text-muted-foreground">{n.time} ago</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── HOME ──
function SellerHomeSection(props: any) {
  const {
    user, loading, products, orders, pendingOrders, incompleteProducts, draftProducts,
    lowStockProducts, outOfStockProducts, ordersThisWeek, revenueThisWeek, netEarningsThisWeek,
    weekOverWeekChange, bestSellers, dormantProducts, bestSellerLowStock, cancellationRate,
    completenessPct, onNavigate, onAddProduct,
  } = props;

  const isNewSeller = products.length === 0 && orders.length === 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="h-20 bg-muted rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (isNewSeller) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-black">Hey {user.name || "there"}</h1>
        <div className="border border-dashed border-border rounded-2xl p-8 text-center">
          <Package className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-sm mb-1">Add your first product to start selling</p>
          <p className="text-xs text-muted-foreground mb-4">Your sales, orders, and store insights will show up here once you have listings.</p>
          <Button size="sm" className="rounded-full" onClick={onAddProduct}><Plus className="w-3.5 h-3.5 mr-1" /> Add Product</Button>
        </div>
      </div>
    );
  }

  const needsAttention = [
    pendingOrders.length > 0 && {
      text: `${pendingOrders.length} order${pendingOrders.length > 1 ? "s" : ""} waiting to be accepted${pendingOrders[0] ? ` — oldest is ${ageLabel(pendingOrders[0].created_at)} old` : ""}`,
      action: () => onNavigate("orders"),
      actionLabel: "Review",
    },
    (incompleteProducts.length > 0 || draftProducts.length > 0) && {
      text: `${incompleteProducts.length + draftProducts.length} draft or incomplete listing${(incompleteProducts.length + draftProducts.length) > 1 ? "s" : ""}`,
      action: () => onNavigate("products"),
      actionLabel: "Fix",
    },
    (lowStockProducts.length > 0 || outOfStockProducts.length > 0) && {
      text: `${lowStockProducts.length + outOfStockProducts.length} product${(lowStockProducts.length + outOfStockProducts.length) > 1 ? "s" : ""} low or out of stock`,
      action: () => onNavigate("products"),
      actionLabel: "Restock",
    },
  ].filter(Boolean) as { text: string; action: () => void; actionLabel: string }[];

  const insight = weekOverWeekChange !== null
    ? `${ordersThisWeek.length} order${ordersThisWeek.length !== 1 ? "s" : ""} this week, ${weekOverWeekChange >= 0 ? "up" : "down"} ${Math.abs(weekOverWeekChange)}% from last week.${bestSellerLowStock ? ` Your best seller, ${bestSellerLowStock.title}, is running low on stock.` : ""}`
    : `${ordersThisWeek.length} order${ordersThisWeek.length !== 1 ? "s" : ""} this week.${bestSellerLowStock ? ` Your best seller, ${bestSellerLowStock.title}, is running low on stock.` : ""}`;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-xl font-black">Hey {user.name || "there"}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Here's what's happening with your store.</p>
      </div>

      <div className="border border-border rounded-2xl p-4">
        <p className="text-sm">{insight}</p>
      </div>

      {needsAttention.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Needs your attention</p>
          <div className="divide-y divide-border border-t border-b border-border">
            {needsAttention.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <p className="text-sm">{item.text}</p>
                <button onClick={item.action} className="text-xs font-bold text-primary shrink-0 ml-3">{item.actionLabel}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">This week</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted rounded-2xl p-3">
            <p className="text-[11px] text-muted-foreground">Revenue</p>
            <p className="text-lg font-black mt-0.5">{formatNaira(revenueThisWeek)}</p>
          </div>
          <div className="bg-muted rounded-2xl p-3">
            <p className="text-[11px] text-muted-foreground">Orders</p>
            <p className="text-lg font-black mt-0.5">{ordersThisWeek.length}</p>
          </div>
          <div className="bg-muted rounded-2xl p-3">
            <p className="text-[11px] text-muted-foreground">Net earnings</p>
            <p className="text-lg font-black mt-0.5">{formatNaira(netEarningsThisWeek)}</p>
          </div>
          <div className="bg-muted rounded-2xl p-3">
            <p className="text-[11px] text-muted-foreground">Live listings</p>
            <p className="text-lg font-black mt-0.5">{products.filter((p: any) => p.status !== "draft").length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">What's selling</p>
          {bestSellers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No sales yet this period.</p>
          ) : (
            <div className="divide-y divide-border border-t border-b border-border">
              {bestSellers.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate">{i + 1}. {b.title}</span>
                  <span className="text-muted-foreground text-xs shrink-0 ml-2">{b.unitsSold} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Not moving (60d+)</p>
          {dormantProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing sitting idle right now.</p>
          ) : (
            <div className="divide-y divide-border border-t border-b border-border">
              {dormantProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate">{p.title}</span>
                  <button onClick={() => onNavigate("products")} className="text-xs font-bold text-primary shrink-0 ml-2">Review</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Store health</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted rounded-2xl p-3">
            <p className="text-[11px] text-muted-foreground">Cancellation rate</p>
            <p className="text-base font-black mt-0.5">{cancellationRate.toFixed(1)}%</p>
          </div>
          <div className="bg-muted rounded-2xl p-3">
            <p className="text-[11px] text-muted-foreground">Store completeness</p>
            <p className="text-base font-black mt-0.5">{completenessPct}%</p>
          </div>
          <div className="bg-muted rounded-2xl p-3">
            <p className="text-[11px] text-muted-foreground">Draft listings</p>
            <p className="text-base font-black mt-0.5">{draftProducts.length}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Recent orders</p>
        <div className="divide-y divide-border border-t border-b border-border">
          {orders.slice(0, 5).map((o: any) => {
            const cfg = ORDER_STATUS_CONFIG[o.admin_status || "pending"] || ORDER_STATUS_CONFIG.pending;
            return (
              <div key={o.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate">#{o.id.slice(0, 8)} · {o.buyer_name || "Unknown buyer"}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{cfg.label} · {ageLabel(o.created_at)}</span>
              </div>
            );
          })}
          {orders.length === 0 && <p className="text-xs text-muted-foreground py-3">No orders yet.</p>}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={onAddProduct}><Plus className="w-3.5 h-3.5 mr-1" /> Add product</Button>
        <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => onNavigate("orders")}><ShoppingCart className="w-3.5 h-3.5 mr-1" /> Review orders</Button>
        <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => onNavigate("analytics")}><BarChart2 className="w-3.5 h-3.5 mr-1" /> View analytics</Button>
      </div>
    </div>
  );
}

// ── PRODUCTS (All / Active / Draft / Thrift / Inventory) ──
function SellerProductsSection({ products, onEdit, onDelete, onDuplicate, onAdd }: any) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft" | "thrift" | "inventory">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const searched = products.filter((p: any) => !search || (p.title || "").toLowerCase().includes(search.toLowerCase()));

  const filtered = searched.filter((p: any) => {
    if (activeTab === "active") return p.status !== "draft" && p.in_stock !== false;
    if (activeTab === "draft") return p.status === "draft";
    if (activeTab === "thrift") return p.is_thrift;
    return true;
  });

  const inventoryRows = [...searched]
    .filter((p: any) => p.status !== "draft")
    .sort((a: any, b: any) => {
      const aOut = a.in_stock === false || a.stock_count === 0 ? 0 : 1;
      const bOut = b.in_stock === false || b.stock_count === 0 ? 0 : 1;
      if (aOut !== bOut) return aOut - bOut;
      return (a.stock_count ?? 999) - (b.stock_count ?? 999);
    });

  const completenessOf = (p: any) => {
    const checks = [p.title, p.price, p.image_url, p.stock_count != null, p.category];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
          { key: "active", label: `Active (${products.filter((p: any) => p.status !== "draft" && p.in_stock !== false).length})` },
          { key: "draft", label: `Draft (${products.filter((p: any) => p.status === "draft").length})` },
          { key: "thrift", label: `Thrift (${products.filter((p: any) => p.is_thrift).length})` },
          { key: "inventory", label: "Inventory" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${activeTab === tab.key ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="rounded-xl pl-9 h-9 text-sm" />
      </div>

      {activeTab === "inventory" ? (
        inventoryRows.length === 0 ? (
          <EmptyState icon={<Package className="w-8 h-8" />} title="No products to show" />
        ) : (
          <div className="border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="p-2.5 font-medium">Product</th>
                  <th className="p-2.5 font-medium">Stock</th>
                  <th className="p-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryRows.map((p: any) => {
                  const variants = Array.isArray(p.variants) ? p.variants : [];
                  const variantStr = variants.length > 0
                    ? variants.map((v: any) => `${v.attributes?.size || v.attributes?.color || "—"}: ${v.stock ?? "—"}`).join(" · ")
                    : String(p.stock_count ?? "—");
                  const out = p.in_stock === false || p.stock_count === 0;
                  const low = !out && typeof p.stock_count === "number" && p.stock_count > 0 && p.stock_count <= 3;
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="p-2.5">{p.title}</td>
                      <td className="p-2.5 text-xs">{variantStr}</td>
                      <td className="p-2.5 text-xs font-medium">
                        {out ? "Out of stock" : low ? "Low stock" : "OK"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Package className="w-8 h-8" />} title="No products here" action={<Button size="sm" className="rounded-full mt-3 text-xs" onClick={onAdd}><Plus className="w-3.5 h-3.5 mr-1" /> Add Product</Button>} />
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="p-2.5 font-medium w-8"><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((p: any) => p.id)) : new Set())} /></th>
                <th className="p-2.5 font-medium">Product</th>
                <th className="p-2.5 font-medium">Price</th>
                <th className="p-2.5 font-medium">Stock</th>
                <th className="p-2.5 font-medium">Complete</th>
                <th className="p-2.5 font-medium">Status</th>
                <th className="p-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-2.5"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelected(p.id)} /></td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="w-8 h-8 rounded-lg object-cover shrink-0 bg-muted" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
                      )}
                      <span className="truncate">{p.title}</span>
                    </div>
                  </td>
                  <td className="p-2.5 text-xs">{p.price ? formatNaira(p.price) : "—"}</td>
                  <td className="p-2.5 text-xs">{p.stock_count ?? "—"}</td>
                  <td className="p-2.5 text-xs">{completenessOf(p)}%</td>
                  <td className="p-2.5 text-xs font-medium">
                    {p.status === "draft" ? "Draft" : p.is_thrift ? "Thrift" : p.in_stock === false ? "Out of stock" : "Active"}
                  </td>
                  <td className="p-2.5">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => onDuplicate(p)} title="Duplicate"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => onEdit(p)} title="Edit"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => onDelete(p.id)} title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selected.size > 0 && (
            <div className="p-2 border-t border-border text-xs text-muted-foreground">
              {selected.size} selected — bulk actions are coming soon.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ORDERS (grouped by urgency, with aging) ──
function SellerOrdersSection({ orders, products, cancellationRate, onUpdateStatus }: any) {
  const needsAction = orders.filter((o: any) => (o.admin_status || "pending") === "pending");
  const inProgress = orders.filter((o: any) => ["accepted", "preparing", "ready_for_pickup"].includes(o.admin_status));
  const handedOff = orders.filter((o: any) => ["out_for_delivery", "delivered", "completed"].includes(o.admin_status));
  const cancelled = orders.filter((o: any) => o.admin_status === "cancelled");

  const OrderRow = ({ o, showAction }: { o: any; showAction: boolean }) => {
    const status = o.admin_status || "pending";
    const cfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
    const product = products.find((p: any) => p.id === o.product_id);
    const currentIndex = SELLER_CONTROLLED_STATUSES.indexOf(status);
    const nextStatus = status === "pending" ? SELLER_CONTROLLED_STATUSES[0] : SELLER_CONTROLLED_STATUSES[currentIndex + 1];

    return (
      <div className="border border-border rounded-2xl p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">#{o.id.slice(0, 8)} · {product?.title || "Product"}</p>
            <p className="text-xs text-muted-foreground">{o.buyer_name || "Unknown buyer"} · Qty {o.quantity || 1} · {ageLabel(o.created_at)} ago</p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-sm font-black">{formatNaira(o.total || o.amount)}</p>
            <p className="text-[10px] font-medium text-muted-foreground">{cfg.label}</p>
          </div>
        </div>
        {showAction && nextStatus && (
          <button onClick={() => onUpdateStatus(o.id, nextStatus)} className="mt-2 text-xs font-bold px-3 py-1.5 rounded-full border border-foreground text-foreground">
            {status === "pending" ? "Accept order" : `Mark ${ORDER_STATUS_CONFIG[nextStatus].label}`}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Orders</h2>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" /> Live
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Cancellation rate: {cancellationRate.toFixed(1)}%</p>

      <OrderGroup title={`Needs action · ${needsAction.length}`} orders={needsAction} render={(o) => <OrderRow key={o.id} o={o} showAction />} />
      <OrderGroup title={`In progress · ${inProgress.length}`} orders={inProgress} render={(o) => <OrderRow key={o.id} o={o} showAction />} />
      <OrderGroup title={`Handed to logistics · ${handedOff.length}`} orders={handedOff} render={(o) => <OrderRow key={o.id} o={o} showAction={false} />} muted />
      <OrderGroup title={`Cancelled · ${cancelled.length}`} orders={cancelled} render={(o) => <OrderRow key={o.id} o={o} showAction={false} />} muted />
    </div>
  );
}

function OrderGroup({ title, orders, render, muted }: any) {
  if (orders.length === 0) return null;
  return (
    <div className={muted ? "opacity-70" : ""}>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-2">{orders.map(render)}</div>
    </div>
  );
}

// ── ANALYTICS (Sales / Products / Performance) ──
function SellerAnalyticsSection({ orders, products, salesByProduct, cancellationRate }: any) {
  const [tab, setTab] = useState<"sales" | "products" | "performance">("sales");
  const [range, setRange] = useState<7 | 30 | 90>(7);

  const inRange = orders.filter((o: any) => isSameDayOrAfter(o.created_at, range));
  const prevRange = orders.filter((o: any) => !isSameDayOrAfter(o.created_at, range) && isSameDayOrAfter(o.created_at, range * 2));
  const revenueInRange = inRange.reduce((s: number, o: any) => s + (o.total || o.amount || 0), 0);
  const revenuePrev = prevRange.reduce((s: number, o: any) => s + (o.total || o.amount || 0), 0);
  const pctChange = revenuePrev > 0 ? Math.round(((revenueInRange - revenuePrev) / revenuePrev) * 100) : null;
  const unitsSold = inRange.reduce((s: number, o: any) => s + (o.quantity || 1), 0);
  const aov = inRange.length > 0 ? revenueInRange / inRange.length : 0;

  const hasEnoughData = orders.length > 0 && (Date.now() - new Date(orders[orders.length - 1]?.created_at || Date.now()).getTime()) > 6 * 24 * 60 * 60 * 1000;

  const salesByCategory: Record<string, number> = {};
  inRange.forEach((o: any) => {
    const p = products.find((pr: any) => pr.id === o.product_id);
    const cat = p?.category || "Uncategorised";
    salesByCategory[cat] = (salesByCategory[cat] || 0) + (o.total || o.amount || 0);
  });

  const productRows = Object.entries(salesByProduct)
    .map(([id, v]: any) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  // Performance metrics — derived from order_events / admin_status only.
  // Fulfillment rate approximated as: orders that ever left "pending" ÷ total.
  const fulfilled = orders.filter((o: any) => o.admin_status && o.admin_status !== "pending" && o.admin_status !== "cancelled").length;
  const fulfillmentRate = orders.length > 0 ? (fulfilled / orders.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black">Analytics</h2>
      <div className="flex gap-1">
        {(["sales", "products", "performance"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize ${tab === t ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {!hasEnoughData && (
        <p className="text-xs text-muted-foreground border border-border rounded-2xl p-3">Not enough order history yet to show reliable trends.</p>
      )}

      {tab === "sales" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {[7, 30, 90].map((r) => (
                <button key={r} onClick={() => setRange(r as any)} className={`text-xs px-2.5 py-1 rounded-full border ${range === r ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>{r}d</button>
              ))}
            </div>
            {pctChange !== null && (
              <span className="text-xs font-medium">{pctChange >= 0 ? "+" : ""}{pctChange}% vs previous period</span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted rounded-2xl p-3"><p className="text-[11px] text-muted-foreground">Revenue</p><p className="text-lg font-black mt-0.5">{formatNaira(revenueInRange)}</p></div>
            <div className="bg-muted rounded-2xl p-3"><p className="text-[11px] text-muted-foreground">Orders</p><p className="text-lg font-black mt-0.5">{inRange.length}</p></div>
            <div className="bg-muted rounded-2xl p-3"><p className="text-[11px] text-muted-foreground">Avg order value</p><p className="text-lg font-black mt-0.5">{formatNaira(aov)}</p></div>
            <div className="bg-muted rounded-2xl p-3"><p className="text-[11px] text-muted-foreground">Units sold</p><p className="text-lg font-black mt-0.5">{unitsSold}</p></div>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Sales by category</p>
            {Object.keys(salesByCategory).length === 0 ? (
              <p className="text-xs text-muted-foreground">No sales in this period.</p>
            ) : (
              <div className="divide-y divide-border border-t border-b border-border">
                {Object.entries(salesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat} className="flex items-center justify-between py-2 text-sm">
                    <span>{cat}</span>
                    <span className="font-medium">{formatNaira(amt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "products" && (
        productRows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No sales recorded yet.</p>
        ) : (
          <div className="border border-border rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="p-2.5 font-medium">Product</th>
                  <th className="p-2.5 font-medium">Units sold</th>
                  <th className="p-2.5 font-medium">Revenue</th>
                  <th className="p-2.5 font-medium">Last sold</th>
                </tr>
              </thead>
              <tbody>
                {productRows.map((r: any) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="p-2.5">{r.title}</td>
                    <td className="p-2.5">{r.unitsSold}</td>
                    <td className="p-2.5">{formatNaira(r.revenue)}</td>
                    <td className="p-2.5 text-xs text-muted-foreground">{ageLabel(r.lastSoldAt)} ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "performance" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted rounded-2xl p-3">
            <p className="text-[11px] text-muted-foreground">Fulfillment rate</p>
            <p className="text-lg font-black mt-0.5">{fulfillmentRate.toFixed(0)}%</p>
          </div>
          <div className="bg-muted rounded-2xl p-3">
            <p className="text-[11px] text-muted-foreground">Cancellation rate</p>
            <p className="text-lg font-black mt-0.5">{cancellationRate.toFixed(1)}%</p>
          </div>
          <div className="bg-muted rounded-2xl p-3">
            <p className="text-[11px] text-muted-foreground">Avg handling time</p>
            <p className="text-lg font-black mt-0.5">Not enough data</p>
            <p className="text-[10px] text-muted-foreground mt-1">Needs order_events with consistent timestamps across statuses.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PROMOTIONS (read-only — no seller-side coupon creation confirmed) ──
function SellerPromotionsSection() {
  // NOTE: KAT's coupon system lives outside this component and is not wired
  // into this mockup-to-implementation pass — there was no coupons
  // query/hook provided alongside Seller.tsx. This section is left as an
  // honest "not connected yet" state rather than fabricating coupon data.
  // When the real coupons table/hook is available, replace this block with
  // a read-only query filtered to coupons applicable to this seller's
  // products, exactly as scoped in the approved architecture.
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black">Promotions</h2>
      <p className="text-xs text-muted-foreground">Coupons that apply to your listings are created and managed by the KAT team.</p>
      <div className="border border-dashed border-border rounded-2xl p-8 text-center">
        <Megaphone className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-bold text-sm">Not connected yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          This section is ready to show active coupons on your products once the coupons data source is connected here.
        </p>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" /> Want a new promotion on your store? Contact sellers@kat.com
      </p>
    </div>
  );
}

// ── EARNINGS ──
function SellerEarningsSection({ orders, revenue }: any) {
  const netEarnings = revenue / 1.095;
  const commission = revenue - netEarnings;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black">Earnings</h2>
      <div className="border border-border rounded-2xl p-5 space-y-3">
        {[
          { label: "Gross Revenue", value: formatNaira(revenue) },
          { label: "KAT Commission (9.5%)", value: `-${formatNaira(commission)}`, negative: true },
          { label: "Net Earnings owed to you", value: formatNaira(netEarnings), bold: true },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <p className="text-sm text-muted-foreground">{row.label}</p>
            <p className={`text-sm font-bold ${row.negative ? "text-destructive" : ""} ${row.bold ? "text-base" : ""}`}>{row.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Recent transactions</p>
        {orders.length === 0 ? (
          <p className="text-xs text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-border border-t border-b border-border">
            {orders.slice(0, 10).map((o: any) => {
              const gross = o.total || o.amount || 0;
              const net = gross / 1.095;
              return (
                <div key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <span>#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}</span>
                  <span className="font-medium">{formatNaira(net)} net</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        This is what KAT owes you from sales to date. Payouts are handled directly by the KAT team — there is currently no in-app withdrawal process.
      </p>
    </div>
  );
}

// ── STORE ──
function SellerStoreSection({ user, isMultiStore, activeStore, completenessChecks, completenessPct, onStoreUpdated }: any) {
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
      setSaveError(friendlyError(error, "Couldn't save your store settings. Please try again."));
      return;
    }
    setSaved(true);
    if (isMultiStore && onStoreUpdated) onStoreUpdated();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-black">
        {isMultiStore ? `${activeStore?.name || "Store"}` : "Store"}
      </h2>

      <div className="flex items-center gap-2">
        <BadgeCheck className="w-4 h-4 text-foreground" />
        <span className="text-sm font-medium">Verified seller</span>
      </div>

      <div className="border border-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold flex items-center gap-2">
          <StoreIcon className="w-4 h-4" /> Store Info
        </p>
        <Input placeholder="Store name" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="rounded-xl h-11" />
        <Textarea placeholder="Store description (visible to buyers on your store page)" value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} className="rounded-xl resize-none" rows={3} />
        <Button className="rounded-full w-full" onClick={saveSettings} disabled={saving}>
          {saved ? "Saved" : saving ? "Saving..." : "Save Settings"}
        </Button>
        {saveError && <p className="text-xs text-destructive font-medium">{saveError}</p>}
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Profile completeness · {completenessPct}%</p>
        <div className="divide-y divide-border border-t border-b border-border">
          {completenessChecks.map((c: any) => (
            <div key={c.label} className="flex items-center gap-2 py-2 text-sm">
              <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.done ? "✓" : "—"}</span>
              <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Storefront preview: only shown if a real public store page exists.
          No such URL/route was provided alongside Seller.tsx, so this link
          is intentionally omitted rather than pointing at a page that may
          not exist. Add it here once the storefront URL is confirmed. */}

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Support</p>
        <p className="text-sm">sellers@kat.com</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, action }: any) {
  return (
    <div className="text-center py-12 border border-border rounded-2xl">
      <div className="text-muted-foreground mx-auto mb-3 flex justify-center">{icon}</div>
      <p className="font-semibold text-sm">{title}</p>
      {action}
    </div>
  );
                  }

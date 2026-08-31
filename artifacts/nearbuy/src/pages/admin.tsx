import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import {
  Home, Users, Store, Package, ShoppingCart, DollarSign,
  BarChart2, AlertTriangle, Bell, Settings, ShieldCheck,
  Trash2, Ban, RefreshCw, Search, ArrowLeft,
  Truck, Eye, Flag, ChevronDown, ChevronUp,
  LogIn, Menu, Wallet, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminStats from "@/components/admin/AdminStats";
import QuickActions from "@/components/admin/QuickActions";
import NeedsAttention from "@/components/admin/NeedsAttention";
import SellerCard from "@/components/admin/SellerCard";
import DeliveryAreas from "@/components/admin/DeliveryAreas";
import Coupons from "@/components/admin/Coupons";
import OrderDetailsDialog from "@/components/admin/OrderDetailsDialog";

function formatNaira(n: number) { return "₦" + Number(n || 0).toLocaleString("en-NG"); }

// NOTE: commission rate is hardcoded at 9.5% throughout the existing
// codebase (Seller.tsx statements, this file's Settings display). There is
// no confirmed configurable-settings table for it, so it stays a constant
// here rather than being turned into a fake editable setting.
const COMMISSION_RATE = 0.095;

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

type AdminSection = "home" | "sellers" | "products" | "orders" | "finance" | "analytics" | "logistics" | "coupons" | "users" | "moderation" | "settings";

const NAV_ITEMS: { key: AdminSection; label: string; icon: React.ReactNode }[] = [
  { key: "home",       label: "Home",       icon: <Home className="w-4 h-4" /> },
  { key: "sellers",    label: "Sellers",    icon: <Store className="w-4 h-4" /> },
  { key: "products",   label: "Products",   icon: <Package className="w-4 h-4" /> },
  { key: "orders",     label: "Orders",     icon: <ShoppingCart className="w-4 h-4" /> },
  { key: "finance",    label: "Finance",    icon: <Wallet className="w-4 h-4" /> },
  { key: "analytics",  label: "Analytics",  icon: <BarChart2 className="w-4 h-4" /> },
  { key: "logistics",  label: "Logistics",  icon: <Truck className="w-4 h-4" /> },
  { key: "coupons",    label: "Coupons",    icon: <Package className="w-4 h-4" /> },
  { key: "users",      label: "Users",      icon: <Users className="w-4 h-4" /> },
  { key: "moderation", label: "Moderation", icon: <Flag className="w-4 h-4" /> },
  { key: "settings",   label: "Settings",   icon: <Settings className="w-4 h-4" /> },
];

const ORDER_STATUS: Record<string, { label: string }> = {
  pending:          { label: "Pending" },
  accepted:         { label: "Accepted" },
  preparing:        { label: "Preparing" },
  ready_for_pickup: { label: "Ready for Pickup" },
  out_for_delivery: { label: "Out for Delivery" },
  delivered:        { label: "Delivered" },
  completed:        { label: "Completed" },
  cancelled:        { label: "Cancelled" },
};

export default function Admin() {
  const { user, signOut } = useAuth();
  const [section, setSection] = useState<AdminSection>("home");
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderEvents, setOrderEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "buyers" | "sellers" | "admins">("all");
  const [productFilter, setProductFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<7 | 30 | 90>(30);

  const isAdmin = user?.isAdmin;

  // ── UNCHANGED: same fetch, same four queries, same shape ──
  const fetchAll = async () => {
    setLoading(true);
    const [{ data: profilesData }, { data: productsData }, { data: ordersData }, { data: eventsData }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("order_events").select("*"),
    ]);
    if (profilesData) {
      setSellers(profilesData.filter((p) => p.is_seller));
      setUsers(profilesData);
    }
    if (productsData) setProducts(productsData);
    if (ordersData) setOrders(ordersData);
    if (eventsData) setOrderEvents(eventsData);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-xl font-black mb-2">Admin Access Only</h1>
        <Link href="/"><Button variant="outline" className="rounded-full mt-2">Back to Home</Button></Link>
      </div>
    );
  }

  // ── UNCHANGED base derivations ──
  const totalRevenue = orders.reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const today = new Date().toDateString();
  const ordersToday = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const revenueToday = ordersToday.reduce((sum, o) => sum + (o.total || o.amount || 0), 0);
  const usersToday = users.filter((u) => new Date(u.created_at).toDateString() === today);
  const sellersToday = sellers.filter((s) => new Date(s.created_at).toDateString() === today);
  const pendingOrders = orders.filter((o) => (o.admin_status || "pending") === "pending").length;
  const pendingSellers = sellers.filter((s) => s.is_seller && !s.seller_verified).length;
  const totalBuyers = users.filter((u) => !u.is_seller && !u.is_admin).length;
  const cancelledOrders = orders.filter((o) => o.admin_status === "cancelled").length;
  const cancellationRate = orders.length > 0 ? (cancelledOrders / orders.length) * 100 : 0;

  const eventsByOrder: Record<string, any[]> = {};
  orderEvents.forEach((e) => {
    if (!eventsByOrder[e.order_id]) eventsByOrder[e.order_id] = [];
    eventsByOrder[e.order_id].push(e);
  });
  const deliveryDurationsMs: number[] = [];
  Object.values(eventsByOrder).forEach((evts) => {
    const placed = evts.find((e) => e.status === "pending");
    const delivered = evts.find((e) => e.status === "delivered");
    if (placed && delivered) {
      const diff = new Date(delivered.created_at).getTime() - new Date(placed.created_at).getTime();
      if (diff > 0) deliveryDurationsMs.push(diff);
    }
  });
  const avgDeliveryMs = deliveryDurationsMs.length > 0
    ? deliveryDurationsMs.reduce((s, d) => s + d, 0) / deliveryDurationsMs.length
    : null;
  const avgDeliveryLabel = avgDeliveryMs === null
    ? "No data yet"
    : avgDeliveryMs < 24 * 60 * 60 * 1000
      ? `${(avgDeliveryMs / (60 * 60 * 1000)).toFixed(1)} hrs`
      : `${(avgDeliveryMs / (24 * 60 * 60 * 1000)).toFixed(1)} days`;

  const areaCounts: Record<string, number> = {};
  orders.forEach((o) => {
    if (o.delivery_area) areaCounts[o.delivery_area] = (areaCounts[o.delivery_area] || 0) + 1;
  });
  const sortedAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);
  const topAreaEntry = sortedAreas[0];
  const topAreaLabel = topAreaEntry ? `${topAreaEntry[0]} (${topAreaEntry[1]})` : "No data yet";

  // ── NEW derived data — all computed client-side from the four queries above, no new backend ──
  const gmv = totalRevenue;
  const katCommissionRevenue = gmv * COMMISSION_RATE;
  const netToSellers = gmv - katCommissionRevenue;

  const gmvInRange = orders.filter((o) => isSameDayOrAfter(o.created_at, analyticsRange)).reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const gmvPrevRange = orders.filter((o) => !isSameDayOrAfter(o.created_at, analyticsRange) && isSameDayOrAfter(o.created_at, analyticsRange * 2)).reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const gmvPctChange = gmvPrevRange > 0 ? Math.round(((gmvInRange - gmvPrevRange) / gmvPrevRange) * 100) : null;

  const ordersInRange = orders.filter((o) => isSameDayOrAfter(o.created_at, analyticsRange));
  const unitsSoldInRange = ordersInRange.reduce((s, o) => s + (o.quantity || 1), 0);
  const aovInRange = ordersInRange.length > 0 ? gmvInRange / ordersInRange.length : 0;

  const buyersInRange = users.filter((u) => !u.is_seller && !u.is_admin && isSameDayOrAfter(u.created_at, analyticsRange)).length;
  const sellersInRange = sellers.filter((s) => isSameDayOrAfter(s.created_at, analyticsRange)).length;
  const listingsInRange = products.filter((p) => isSameDayOrAfter(p.created_at, analyticsRange)).length;

  // order pipeline counts (platform-wide) — real, from admin_status
  const pipelineCounts: Record<string, number> = {};
  Object.keys(ORDER_STATUS).forEach((s) => { pipelineCounts[s] = orders.filter((o) => (o.admin_status || "pending") === s).length; });

  // aging orders (pending/accepted/preparing sitting > 48h)
  const agingOrders = orders.filter((o) => {
    const status = o.admin_status || "pending";
    return ["pending", "accepted", "preparing"].includes(status) && !isSameDayOrAfter(o.created_at, 2);
  });

  // top sellers / top products by revenue (platform-wide, all-time — real join)
  const revenueBySeller: Record<string, { name: string; revenue: number; orders: number }> = {};
  orders.forEach((o) => {
    if (!o.seller_id) return;
    const seller = users.find((u) => u.id === o.seller_id);
    const key = o.seller_id;
    if (!revenueBySeller[key]) revenueBySeller[key] = { name: seller?.full_name || seller?.store_name || "Unknown seller", revenue: 0, orders: 0 };
    revenueBySeller[key].revenue += o.total || o.amount || 0;
    revenueBySeller[key].orders += 1;
  });
  const topSellers = Object.values(revenueBySeller).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const revenueByProduct: Record<string, { title: string; revenue: number; units: number }> = {};
  orders.forEach((o) => {
    const product = products.find((p) => p.id === o.product_id);
    if (!product) return;
    const key = product.id;
    if (!revenueByProduct[key]) revenueByProduct[key] = { title: product.title, revenue: 0, units: 0 };
    revenueByProduct[key].revenue += o.total || o.amount || 0;
    revenueByProduct[key].units += o.quantity || 1;
  });
  const topProducts = Object.values(revenueByProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const revenueByCategory: Record<string, number> = {};
  orders.forEach((o) => {
    const product = products.find((p) => p.id === o.product_id);
    const cat = product?.category || "Uncategorised";
    revenueByCategory[cat] = (revenueByCategory[cat] || 0) + (o.total || o.amount || 0);
  });

  // fulfillment rate (platform-wide) — orders that left "pending" without cancelling
  const fulfilledCount = orders.filter((o) => o.admin_status && o.admin_status !== "pending" && o.admin_status !== "cancelled").length;
  const fulfillmentRate = orders.length > 0 ? (fulfilledCount / orders.length) * 100 : 0;

  // per-seller performance (for Sellers section's seller-detail context — used when SellerCard needs it)
  const sellerPerformance = (sellerId: string) => {
    const sOrders = orders.filter((o) => o.seller_id === sellerId);
    const sCancelled = sOrders.filter((o) => o.admin_status === "cancelled").length;
    const sFulfilled = sOrders.filter((o) => o.admin_status && o.admin_status !== "pending" && o.admin_status !== "cancelled").length;
    return {
      revenue: sOrders.reduce((s, o) => s + (o.total || o.amount || 0), 0),
      orderCount: sOrders.length,
      cancellationRate: sOrders.length > 0 ? (sCancelled / sOrders.length) * 100 : 0,
      fulfillmentRate: sOrders.length > 0 ? (sFulfilled / sOrders.length) * 100 : 0,
    };
  };

  // recent activity feed — merged from real events, no fabricated entries
  const activityFeed = [
    ...orders.slice(0, 8).map((o) => ({ type: "order", time: o.created_at, text: `Order #${o.id.slice(0, 8)} placed${o.buyer_name ? ` by ${o.buyer_name}` : ""}`, amount: o.total || o.amount })),
    ...orders.filter((o) => o.admin_status === "cancelled").slice(0, 5).map((o) => ({ type: "cancel", time: o.updated_at || o.created_at, text: `Order #${o.id.slice(0, 8)} cancelled` })),
    ...sellers.filter((s) => s.seller_verified).slice(0, 5).map((s) => ({ type: "seller", time: s.created_at, text: `${s.full_name || s.email} verified as a seller` })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

  const platformHealthLine = `${gmvPctChange !== null ? `GMV ${gmvPctChange >= 0 ? "up" : "down"} ${Math.abs(gmvPctChange)}% vs previous ${analyticsRange}d` : `${formatNaira(gmvInRange)} GMV in the last ${analyticsRange} days`}. ${pendingSellers} seller${pendingSellers !== 1 ? "s" : ""} awaiting verification. Cancellation rate at ${cancellationRate.toFixed(1)}%.`;

  // ── UNCHANGED mutations ──
  const approveSeller = async (id: string) => {
    setActionLoading(id);
    await supabase.from("profiles").update({ seller_verified: true, is_seller: true }).eq("id", id);
    await fetchAll();
    setActionLoading(null);
  };

  const rejectSeller = async (id: string) => {
    setActionLoading(id);
    await supabase.from("profiles").update({ seller_verified: false, is_seller: false }).eq("id", id);
    await fetchAll();
    setActionLoading(null);
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    setActionLoading(id);
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setActionLoading(null);
  };

  const banUser = async (id: string, banned: boolean) => {
    setActionLoading(id);
    await supabase.from("profiles").update({ is_banned: !banned }).eq("id", id);
    await fetchAll();
    setActionLoading(null);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setActionLoading(orderId);
    const { error } = await supabase.from("orders").update({ admin_status: status, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) {
      console.error("STATUS UPDATE FAILED:", error);
      alert("Failed to update order status: " + error.message);
      setActionLoading(null);
      return;
    }
    await supabase.from("order_events").insert({ order_id: orderId, status });
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, admin_status: status } : o));
    setSelectedOrder((prev: any) => prev && prev.id === orderId ? { ...prev, admin_status: status } : prev);
    setActionLoading(null);
  };

  // ── UNCHANGED 7-day series (still used for existing chart-adjacent logic where relevant) ──
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-NG", { weekday: "short" });
    const dayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === d.toDateString());
    return { name: label, revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0), orders: dayOrders.length };
  });

  // ── UNCHANGED filters ──
  const filteredOrders = orders.filter((o) => {
    const matchFilter = orderFilter === "all" || (o.admin_status || "pending") === orderFilter;
    if (!search) return matchFilter;
    const q = search.toLowerCase();
    const product = products.find((p) => p.id === o.product_id);
    const seller = users.find((u) => u.id === o.seller_id);
    const matchSearch = [o.id, o.buyer_name, o.buyer_phone, o.buyer_address, o.delivery_area, o.delivery_state, product?.title, seller?.full_name].some((f) => f?.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  const filteredSellers = sellers.filter((s) => {
    const status = s.seller_verified ? "approved" : "pending";
    const matchFilter = sellerFilter === "all" || status === sellerFilter;
    const matchSearch = !search || [s.full_name, s.email].some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const filteredProducts = products.filter((p) => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = productFilter === "all"
      || (productFilter === "out_of_stock" && (p.in_stock === false || p.stock_count === 0))
      || (productFilter === "draft" && p.status === "draft")
      || (productFilter === "thrift" && p.is_thrift);
    return matchSearch && matchFilter;
  });

  const filteredUsers = users.filter((u) => {
    const matchSearch = !search || [u.full_name, u.email].some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    const matchRole = userRoleFilter === "all"
      || (userRoleFilter === "buyers" && !u.is_seller && !u.is_admin)
      || (userRoleFilter === "sellers" && u.is_seller)
      || (userRoleFilter === "admins" && u.is_admin);
    return matchSearch && matchRole;
  });

  const sidebarNav = (closeAfterClick: boolean) => (
    <>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          onClick={() => { setSection(item.key); setSearch(""); if (closeAfterClick) setMobileMenuOpen(false); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            section === item.key ? "bg-muted text-foreground font-bold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}>
          {item.icon} {item.label}
          {item.key === "orders" && pendingOrders > 0 && (
            <span className="ml-auto bg-foreground text-background text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingOrders}</span>
          )}
          {item.key === "sellers" && pendingSellers > 0 && (
            <span className="ml-auto bg-foreground text-background text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingSellers}</span>
          )}
        </button>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">

      <aside className="w-56 shrink-0 bg-card border-r border-border min-h-screen sticky top-0 hidden md:flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/"><span className="text-xl font-black text-primary cursor-pointer">KAT</span></Link>
          <p className="text-[10px] text-muted-foreground mt-0.5">Admin Center</p>
        </div>
        <div className="p-4 border-b border-border">
          <p className="text-sm font-bold truncate">{user.name || "Admin"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarNav(false)}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          <Link href="/me">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to KAT
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
            <button onClick={() => setMobileMenuOpen(true)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Open menu">
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-lg font-black text-primary">KAT</span>
          </div>
          <p className="text-xs font-semibold">Admin</p>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button onClick={() => setNotifOpen((v) => !v)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center relative" aria-label="Notifications">
                <Bell className="w-4 h-4" />
                {(pendingSellers > 0 || agingOrders.length > 0) && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-foreground" />}
              </button>
              {notifOpen && (
                <div className="absolute top-11 right-0 w-64 bg-card border border-border rounded-2xl shadow-xl z-50 p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-xs font-bold text-muted-foreground">Notifications</p>
                    <button onClick={() => setNotifOpen(false)}><X className="w-3.5 h-3.5" /></button>
                  </div>
                  {pendingSellers === 0 && agingOrders.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2 py-4 text-center">You're all caught up.</p>
                  ) : (
                    <div className="space-y-0.5 mt-1">
                      {pendingSellers > 0 && (
                        <button onClick={() => { setSection("sellers"); setNotifOpen(false); setMobileMenuOpen(false); }} className="w-full text-left px-2 py-2 rounded-xl hover:bg-muted text-xs">
                          {pendingSellers} seller{pendingSellers !== 1 ? "s" : ""} awaiting verification
                        </button>
                      )}
                      {agingOrders.length > 0 && (
                        <button onClick={() => { setSection("orders"); setNotifOpen(false); setMobileMenuOpen(false); }} className="w-full text-left px-2 py-2 rounded-xl hover:bg-muted text-xs">
                          {agingOrders.length} order{agingOrders.length !== 1 ? "s" : ""} pending 48h+
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={fetchAll} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile hamburger drawer — reuses the exact same NAV_ITEMS list, `section`
          state, and setSection setter as the desktop sidebar via sidebarNav().
          No separate nav data or duplicated routing logic. */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-card h-full flex flex-col shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <span className="text-xl font-black text-primary">KAT</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Admin Center</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center" aria-label="Close menu">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 border-b border-border shrink-0">
              <p className="text-sm font-bold truncate">{user.name || "Admin"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            {/* min-h-0 + overflow-y-auto ensures this scrolls independently and
                never gets clipped by the fixed header/footer above/below it */}
            <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto overscroll-contain">
              {sidebarNav(true)}
            </nav>
            <div className="p-3 border-t border-border space-y-1 shrink-0" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
              <Link href="/me">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-all">
                  <ArrowLeft className="w-4 h-4" /> Back to KAT
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
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

          {/* ── HOME (rebuilt as command center) ── */}
          {section === "home" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-black">Marketplace overview</h1>
                <p className="text-sm text-muted-foreground mt-1">{platformHealthLine}</p>
              </div>

              {/* Needs attention — plain rows, no colored circles. Preserves existing NeedsAttention component. */}
              <NeedsAttention pendingSellers={pendingSellers} pendingOrders={pendingOrders} setSection={setSection as any} />
              {agingOrders.length > 0 && (
                <div className="flex items-center justify-between py-2 border-t border-border">
                  <p className="text-sm">{agingOrders.length} order{agingOrders.length !== 1 ? "s" : ""} pending more than 48 hours</p>
                  <button onClick={() => setSection("orders")} className="text-xs font-bold text-primary">Review</button>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-t border-b border-border">
                <p className="text-sm text-muted-foreground">Moderation queue</p>
                <span className="text-xs text-muted-foreground">Coming soon</span>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">This period ({analyticsRange}d)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Metric label="GMV" value={formatNaira(gmvInRange)} />
                  <Metric label="KAT commission" value={formatNaira(gmvInRange * COMMISSION_RATE)} />
                  <Metric label="Orders" value={String(ordersInRange.length)} />
                  <Metric label="New sellers" value={String(sellersInRange)} />
                  <Metric label="New buyers" value={String(buyersInRange)} />
                  <Metric label="New listings" value={String(listingsInRange)} />
                  <Metric label="Active sellers" value={String(sellers.filter((s) => s.seller_verified).length)} />
                  <Metric label="Cancellation rate" value={`${cancellationRate.toFixed(1)}%`} />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Order pipeline</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(pipelineCounts).map(([status, count]) => (
                    <div key={status} className="border border-border rounded-xl px-3 py-2 text-xs">
                      <span className="font-bold">{count}</span> <span className="text-muted-foreground">{ORDER_STATUS[status].label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">GMV trend</p>
                <TrendChart orders={orders} rangeDays={analyticsRange} metric="revenue" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Top sellers</p>
                  {topSellers.length === 0 ? <p className="text-xs text-muted-foreground">No sales yet.</p> : (
                    <div className="divide-y divide-border border-t border-b border-border">
                      {topSellers.map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-2 text-sm">
                          <span className="truncate">{i + 1}. {s.name}</span>
                          <span className="text-xs text-muted-foreground">{formatNaira(s.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Top products</p>
                  {topProducts.length === 0 ? <p className="text-xs text-muted-foreground">No sales yet.</p> : (
                    <div className="divide-y divide-border border-t border-b border-border">
                      {topProducts.map((p, i) => (
                        <div key={i} className="flex items-center justify-between py-2 text-sm">
                          <span className="truncate">{i + 1}. {p.title}</span>
                          <span className="text-xs text-muted-foreground">{formatNaira(p.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Recent activity</p>
                <div className="divide-y divide-border border-t border-b border-border">
                  {activityFeed.map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                      <span className="truncate">{a.text}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{ageLabel(a.time)} ago</span>
                    </div>
                  ))}
                  {activityFeed.length === 0 && <p className="text-xs text-muted-foreground py-3">No activity yet.</p>}
                </div>
              </div>

              {/* Preserves existing QuickActions component untouched. */}
              <QuickActions setSection={setSection as any} />
            </div>
          )}

          {/* ── SELLERS — UNCHANGED, preserved exactly pending SellerCard.tsx ── */}
          {section === "sellers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">Sellers ({sellers.length})</h2>
                <div className="flex gap-1">
                  {["all", "pending", "approved"].map((f) => (
                    <button key={f} onClick={() => setSellerFilter(f)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize ${sellerFilter === f ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sellers..." className="rounded-xl pl-9 h-9 text-sm" />
              </div>
              {filteredSellers.length === 0 ? (
                <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
                  <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-sm">No sellers found</p>
                </div>
              ) : (
                <>
                  {filteredSellers.map((seller) => {
                    const sellerProducts = products.filter((p) => p.seller_id === seller.id);
                    const sellerOrders = orders.filter((o) => o.seller_id === seller.id);
                    const sellerRevenue = sellerOrders.reduce((s, o) => s + (o.total || 0), 0);
                    return (
                      <SellerCard
                        key={seller.id}
                        seller={seller}
                        products={sellerProducts}
                        orders={sellerOrders}
                        revenue={sellerRevenue}
                        approveSeller={approveSeller}
                        rejectSeller={rejectSeller}
                        actionLoading={actionLoading}
                      />
                    );
                  })}
                </>
              )}
              {/* NOTE: seller suspension/deactivation is intentionally not implemented here.
                  is_banned exists on `profiles` but it's unconfirmed whether that field is
                  enforced against a seller's ability to sell (vs. buyer-only banning as used
                  in Users below). Not wiring a fake suspend action until that's confirmed. */}
            </div>
          )}

          {/* ── PRODUCTS — rebuilt as catalog workspace on real fields ── */}
          {section === "products" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black">Products ({products.length})</h2>
              <div className="flex gap-1 flex-wrap">
                {[
                  { key: "all", label: `All (${products.length})` },
                  { key: "draft", label: `Draft (${products.filter((p) => p.status === "draft").length})` },
                  { key: "thrift", label: `Thrift (${products.filter((p) => p.is_thrift).length})` },
                  { key: "out_of_stock", label: `Out of stock (${products.filter((p) => p.in_stock === false || p.stock_count === 0).length})` },
                ].map((f) => (
                  <button key={f.key} onClick={() => setProductFilter(f.key)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${productFilter === f.key ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="rounded-xl pl-9 h-9 text-sm" />
              </div>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
                  <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-sm">No products found</p>
                </div>
              ) : (
                <div className="border border-border rounded-2xl overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="p-2.5 font-medium">Product</th>
                        <th className="p-2.5 font-medium">Seller</th>
                        <th className="p-2.5 font-medium">Price</th>
                        <th className="p-2.5 font-medium">Stock</th>
                        <th className="p-2.5 font-medium">Status</th>
                        <th className="p-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => {
                        const seller = users.find((u) => u.id === p.seller_id);
                        return (
                          <tr key={p.id} className="border-b border-border last:border-0">
                            <td className="p-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                {p.image_url ? <img src={p.image_url} alt={p.title} className="w-8 h-8 rounded-lg object-cover shrink-0 bg-muted" /> : <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />}
                                <span className="truncate">{p.title}</span>
                              </div>
                            </td>
                            <td className="p-2.5 text-xs">{seller?.full_name || seller?.store_name || "—"}</td>
                            <td className="p-2.5 text-xs">{p.price ? formatNaira(p.price) : "—"}</td>
                            <td className="p-2.5 text-xs">{p.stock_count ?? "—"}</td>
                            <td className="p-2.5 text-xs font-medium">{p.status === "draft" ? "Draft" : p.in_stock === false ? "Out of stock" : "Active"}</td>
                            <td className="p-2.5">
                              <div className="flex gap-2 justify-end">
                                <Link href={`/listing/${p.id}`}><Eye className="w-3.5 h-3.5 text-muted-foreground" /></Link>
                                <button onClick={() => deleteProduct(p.id)} disabled={actionLoading === p.id}><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {/* NOTE: no pending_review/moderation status exists on products — listing
                  approval workflow is not implemented, consistent with the audit. */}
            </div>
          )}

          {/* ── ORDERS — rebuilt as grouped operational pipeline ── */}
          {section === "orders" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">Orders ({orders.length})</h2>
                <button onClick={fetchAll} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Cancellation rate: {cancellationRate.toFixed(1)}% · Fulfillment rate: {fulfillmentRate.toFixed(0)}%</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order ID, buyer, phone, seller, product, or area..." className="rounded-xl pl-9 h-9 text-sm" />
              </div>

              {(() => {
                const groups: { title: string; statuses: string[] }[] = [
                  { title: "Needs action", statuses: ["pending"] },
                  { title: "In progress", statuses: ["accepted", "preparing", "ready_for_pickup"] },
                  { title: "Handed to logistics", statuses: ["out_for_delivery", "delivered"] },
                  { title: "Completed", statuses: ["completed"] },
                  { title: "Cancelled", statuses: ["cancelled"] },
                ];
                return groups.map((g) => {
                  const rows = filteredOrders.filter((o) => g.statuses.includes(o.admin_status || "pending"));
                  if (rows.length === 0) return null;
                  return (
                    <div key={g.title}>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{g.title} · {rows.length}</p>
                      <div className="space-y-2">
                        {rows.map((order) => {
                          const status = order.admin_status || "pending";
                          const isAging = ["pending", "accepted", "preparing"].includes(status) && !isSameDayOrAfter(order.created_at, 2);
                          return (
                            <div key={order.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30" onClick={() => setSelectedOrder(order)}>
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-[11px] text-muted-foreground">#{order.id.slice(0, 8)}</p>
                                <p className="font-bold text-sm truncate">{order.buyer_name || "Unknown buyer"}</p>
                                <p className="text-[11px] text-muted-foreground">{ORDER_STATUS[status]?.label || status} · {ageLabel(order.created_at)} ago{isAging ? " · aging" : ""}</p>
                              </div>
                              <p className="font-black shrink-0">{formatNaira(order.total || order.amount)}</p>
                              <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
              {filteredOrders.length === 0 && (
                <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-sm">No orders found</p>
                </div>
              )}
              {/* Bulk actions and returns/refunds are not implemented — no confirmed
                  return policy or bulk-update UI exists in the current codebase. */}
            </div>
          )}

          {/* ── FINANCE — new, real ledger, no payout execution ── */}
          {section === "finance" && (
            <div className="space-y-5">
              <h2 className="text-lg font-black">Finance</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Metric label="GMV (all time)" value={formatNaira(gmv)} />
                <Metric label="KAT commission earned" value={formatNaira(katCommissionRevenue)} />
                <Metric label="Owed to sellers (net)" value={formatNaira(netToSellers)} />
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Commission trend</p>
                <TrendChart orders={orders} rangeDays={analyticsRange} metric="commission" commissionRate={COMMISSION_RATE} />
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Amount owed by seller</p>
                {topSellers.length === 0 ? <p className="text-xs text-muted-foreground">No sales yet.</p> : (
                  <div className="border border-border rounded-2xl overflow-x-auto">
                    <table className="w-full text-sm min-w-[480px]">
                      <thead><tr className="text-left text-xs text-muted-foreground border-b border-border"><th className="p-2.5 font-medium">Seller</th><th className="p-2.5 font-medium">Gross sales</th><th className="p-2.5 font-medium">Commission</th><th className="p-2.5 font-medium">Net owed</th></tr></thead>
                      <tbody>
                        {topSellers.map((s, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="p-2.5">{s.name}</td>
                            <td className="p-2.5">{formatNaira(s.revenue)}</td>
                            <td className="p-2.5">{formatNaira(s.revenue * COMMISSION_RATE)}</td>
                            <td className="p-2.5 font-medium">{formatNaira(s.revenue * (1 - COMMISSION_RATE))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Recent transactions</p>
                <div className="divide-y divide-border border-t border-b border-border">
                  {orders.slice(0, 10).map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-2 text-sm">
                      <span>#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}</span>
                      <span className="text-xs text-muted-foreground">{formatNaira(o.total || o.amount)} gross · {formatNaira((o.total || o.amount || 0) * COMMISSION_RATE)} commission</span>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-xs text-muted-foreground py-3">No transactions yet.</p>}
                </div>
              </div>

              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                This is a financial ledger only. KAT currently has no payout execution infrastructure — no withdrawal flow, bank details, or payout status exist in the system.
              </p>
            </div>
          )}

          {/* ── ANALYTICS — real workspace ── */}
          {section === "analytics" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">Analytics</h2>
                <div className="flex gap-1">
                  {[7, 30, 90].map((r) => (
                    <button key={r} onClick={() => setAnalyticsRange(r as any)} className={`text-xs px-2.5 py-1 rounded-full border ${analyticsRange === r ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>{r}d</button>
                  ))}
                </div>
              </div>
              {gmvPctChange !== null && <p className="text-xs font-medium">{gmvPctChange >= 0 ? "+" : ""}{gmvPctChange}% GMV vs previous period</p>}

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">GMV trend</p>
                <TrendChart orders={orders} rangeDays={analyticsRange} metric="revenue" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric label="GMV" value={formatNaira(gmvInRange)} />
                <Metric label="Orders" value={String(ordersInRange.length)} />
                <Metric label="AOV" value={formatNaira(aovInRange)} />
                <Metric label="Units sold" value={String(unitsSoldInRange)} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Metric label="New buyers" value={String(buyersInRange)} />
                <Metric label="New sellers" value={String(sellersInRange)} />
                <Metric label="New listings" value={String(listingsInRange)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Top products</p>
                  <div className="divide-y divide-border border-t border-b border-border">
                    {topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-2 text-sm"><span className="truncate">{p.title}</span><span className="text-xs text-muted-foreground">{p.units} sold</span></div>
                    ))}
                    {topProducts.length === 0 && <p className="text-xs text-muted-foreground py-2">No sales yet.</p>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Top sellers</p>
                  <div className="divide-y divide-border border-t border-b border-border">
                    {topSellers.map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-2 text-sm"><span className="truncate">{s.name}</span><span className="text-xs text-muted-foreground">{formatNaira(s.revenue)}</span></div>
                    ))}
                    {topSellers.length === 0 && <p className="text-xs text-muted-foreground py-2">No sales yet.</p>}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Category performance</p>
                <div className="divide-y divide-border border-t border-b border-border">
                  {Object.entries(revenueByCategory).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, amt]) => (
                    <div key={cat} className="flex items-center justify-between py-2 text-sm"><span>{cat}</span><span className="font-medium">{formatNaira(amt)}</span></div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Metric label="Cancellation rate" value={`${cancellationRate.toFixed(1)}%`} />
                <Metric label="Fulfillment rate" value={`${fulfillmentRate.toFixed(0)}%`} />
                <Metric label="Avg delivery time" value={avgDeliveryLabel} />
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Delivery area performance</p>
                <div className="divide-y divide-border border-t border-b border-border">
                  {sortedAreas.slice(0, 6).map(([area, count]) => (
                    <div key={area} className="flex items-center justify-between py-2 text-sm"><span>{area}</span><span className="font-medium">{count} orders</span></div>
                  ))}
                  {sortedAreas.length === 0 && <p className="text-xs text-muted-foreground py-2">No delivery-area data yet.</p>}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Marketplace funnel (listing → order conversion) is not shown here — KAT has no product-view/impression tracking, so only order-side metrics are reliable. A full funnel requires new tracking infrastructure.
              </p>
            </div>
          )}

          {/* ── LOGISTICS — preserves DeliveryAreas, adds real derived metrics around it ── */}
          {section === "logistics" && (
            <div className="space-y-5">
              <h2 className="text-lg font-black">Logistics</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Metric label="Awaiting logistics" value={String(pipelineCounts["ready_for_pickup"] || 0)} />
                <Metric label="With logistics" value={String((pipelineCounts["out_for_delivery"] || 0) + (pipelineCounts["delivered"] || 0))} />
                <Metric label="Avg delivery time" value={avgDeliveryLabel} />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Top delivery area</p>
                <p className="text-sm">{topAreaLabel}</p>
              </div>
              {agingOrders.length > 0 && (
                <p className="text-sm">{agingOrders.length} order{agingOrders.length !== 1 ? "s" : ""} delayed beyond 48 hours in fulfillment.</p>
              )}
              {/* Preserves existing DeliveryAreas component untouched. */}
              <DeliveryAreas />
            </div>
          )}

          {/* ── COUPONS — UNCHANGED, preserved exactly pending Coupons.tsx ── */}
          {section === "coupons" && <Coupons />}

          {/* ── USERS — buyer-focused, role filter added ── */}
          {section === "users" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black">Users ({users.length})</h2>
              <div className="flex gap-1">
                {(["all", "buyers", "sellers", "admins"] as const).map((f) => (
                  <button key={f} onClick={() => setUserRoleFilter(f)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition-all ${userRoleFilter === f ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="rounded-xl pl-9 h-9 text-sm" />
              </div>
              <div className="space-y-2">
                {filteredUsers.map((u, i) => {
                  const uOrders = orders.filter((o) => o.buyer_name === u.full_name);
                  return (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                      className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-primary">{(u.full_name || u.email || "?").slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm">{u.full_name || "Unnamed"}</p>
                          {u.is_admin && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted">Admin</span>}
                          {u.is_seller && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted">Seller</span>}
                          {u.is_banned && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted">Banned</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        {uOrders.length > 0 && <p className="text-[11px] text-muted-foreground mt-0.5">{uOrders.length} order{uOrders.length !== 1 ? "s" : ""} placed</p>}
                      </div>
                      {!u.is_admin && (
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => banUser(u.id, u.is_banned)} disabled={actionLoading === u.id}
                            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (window.confirm("Delete user?")) { supabase.from("profiles").delete().eq("id", u.id); setUsers((prev) => prev.filter((x) => x.id !== u.id)); } }}
                            className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              {/* NOTE: buyer order-history match above is by buyer_name (best available
                  linkage in the current orders schema); if orders carry a buyer_id this
                  should switch to that once confirmed. */}
            </div>
          )}

          {/* ── MODERATION — restrained Coming Soon, no fabricated data ── */}
          {section === "moderation" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black">Moderation</h2>
              <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
                <Flag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-sm">Moderation tools are not yet built</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  KAT does not currently have infrastructure for reported listings, reported sellers, or moderation cases. This section is reserved for that work.
                </p>
              </div>
            </div>
          )}

          {/* ── SETTINGS — UNCHANGED ── */}
          {section === "settings" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black">Settings</h2>
              <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                <p className="text-sm font-bold">Platform Info</p>
                {[
                  { label: "Platform Name", value: "KAT Marketplace" },
                  { label: "Commission Rate", value: "9.5%" },
                  { label: "Support Contact", value: "support@kat.ng" },
                  { label: "Version", value: "MVP 1.0" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Commission rate is currently a fixed value used throughout the codebase, not a configurable setting. Category, delivery, and marketplace-rule configuration are not yet editable from Admin.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* ── UNCHANGED ── */}
      <OrderDetailsDialog
        open={!!selectedOrder}
        order={selectedOrder}
        product={selectedOrder ? products.find((p) => p.id === selectedOrder.product_id) : null}
        seller={selectedOrder ? users.find((u) => u.id === selectedOrder.seller_id) : null}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={updateOrderStatus}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-2xl p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-black mt-0.5">{value}</p>
    </div>
  );
}

// Real bucketed chart — GMV or commission, computed from actual orders. No
// fabricated data; zero-height bars where there's no revenue in a bucket.
function TrendChart({ orders, rangeDays, metric, commissionRate }: { orders: any[]; rangeDays: number; metric: "revenue" | "commission"; commissionRate?: number }) {
  const bucketCount = rangeDays <= 7 ? 7 : rangeDays <= 30 ? 10 : 12;
  const bucketMs = (rangeDays * 24 * 60 * 60 * 1000) / bucketCount;
  const now = Date.now();
  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const start = now - (bucketCount - i) * bucketMs;
    const end = start + bucketMs;
    const total = orders
      .filter((o: any) => { const t = new Date(o.created_at).getTime(); return t >= start && t < end; })
      .reduce((s: number, o: any) => s + (o.total || o.amount || 0), 0);
    return metric === "commission" ? total * (commissionRate || 0) : total;
  });
  const max = Math.max(...buckets, 1);

  if (orders.length === 0) {
    return <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border border-border rounded-2xl">No data in this period yet.</div>;
  }

  return (
    <div className="border border-border rounded-2xl p-3">
      <div className="flex items-end gap-1.5 h-24">
        {buckets.map((v, i) => (
          <div key={i} className="flex-1 bg-muted rounded-t-sm relative group" style={{ height: `${Math.max((v / max) * 100, 2)}%` }}>
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap">{formatNaira(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
  }

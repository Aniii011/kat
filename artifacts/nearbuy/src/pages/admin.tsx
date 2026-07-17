import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import {
  Home, Users, Store, Package, ShoppingCart, DollarSign,
  BarChart2, AlertTriangle, Bell, Settings, ShieldCheck,
  Check, X, Trash2, Ban, RefreshCw, Search, ArrowLeft,
  Mail, Calendar, Clock, Truck, Send, CheckCircle,
  XCircle, TrendingUp, Eye, Flag, ChevronDown, ChevronUp,
  Phone, MapPin, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function formatNaira(n: number) { return "₦" + Number(n || 0).toLocaleString("en-NG"); }

type AdminSection = "home" | "sellers" | "products" | "orders" | "users" | "analytics" | "reports" | "settings";

const NAV_ITEMS: { key: AdminSection; label: string; icon: React.ReactNode }[] = [
  { key: "home",      label: "Dashboard",  icon: <Home className="w-4 h-4" /> },
  { key: "sellers",   label: "Sellers",    icon: <Store className="w-4 h-4" /> },
  { key: "products",  label: "Products",   icon: <Package className="w-4 h-4" /> },
  { key: "orders",    label: "Orders",     icon: <ShoppingCart className="w-4 h-4" /> },
  { key: "users",     label: "Users",      icon: <Users className="w-4 h-4" /> },
  { key: "analytics", label: "Analytics",  icon: <BarChart2 className="w-4 h-4" /> },
  { key: "reports",   label: "Reports",    icon: <Flag className="w-4 h-4" /> },
  { key: "settings",  label: "Settings",   icon: <Settings className="w-4 h-4" /> },
];

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-700" },
  assigned:  { label: "Assigned",  color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

export default function Admin() {
  const { user } = useAuth();
  const [section, setSection] = useState<AdminSection>("home");
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");

  const isAdmin = user?.isAdmin;

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: profilesData }, { data: productsData }, { data: ordersData }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ]);
    if (profilesData) {
      setSellers(profilesData.filter((p) => p.is_seller));
      setUsers(profilesData);
    }
    if (productsData) setProducts(productsData);
    if (ordersData) setOrders(ordersData);
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

  // Stats
  const totalRevenue = orders.reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const pendingOrders = orders.filter((o) => (o.admin_status || "pending") === "pending").length;
  const pendingSellers = sellers.filter((s) => s.is_seller && !s.seller_verified).length;
  const totalBuyers = users.filter((u) => !u.is_seller && !u.is_admin).length;

  // Actions
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
    await supabase.from("orders").update({ admin_status: status, updated_at: new Date().toISOString() }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, admin_status: status } : o));
    setActionLoading(null);
  };

  // Chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-NG", { weekday: "short" });
    const dayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === d.toDateString());
    return { name: label, revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0), orders: dayOrders.length };
  });

  const filteredOrders = orders.filter((o) => {
    const matchFilter = orderFilter === "all" || (o.admin_status || "pending") === orderFilter;
    const matchSearch = !search || [o.id, o.buyer_name, o.buyer_address].some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const filteredSellers = sellers.filter((s) => {
    const status = s.seller_verified ? "approved" : "pending";
    const matchFilter = sellerFilter === "all" || status === sellerFilter;
    const matchSearch = !search || [s.full_name, s.email].some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const filteredProducts = products.filter((p) =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter((u) =>
    !search || [u.full_name, u.email].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background flex">

      {/* Sidebar — desktop */}
      <aside className="w-56 shrink-0 bg-card border-r border-border min-h-screen sticky top-0 hidden md:flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/"><span className="text-xl font-black text-primary cursor-pointer">KAT</span></Link>
          <p className="text-[10px] text-muted-foreground mt-0.5">Admin Center</p>
        </div>
        <div className="p-4 border-b border-border">
          <p className="text-sm font-bold truncate">{user.name || "Admin"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.key} onClick={() => { setSection(item.key); setSearch(""); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                section === item.key ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
              {item.icon} {item.label}
              {item.key === "orders" && pendingOrders > 0 && (
                <span className="ml-auto bg-destructive text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingOrders}</span>
              )}
              {item.key === "sellers" && pendingSellers > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingSellers}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Link href="/me">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to KAT
            </button>
          </Link>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/"><span className="text-lg font-black text-primary">KAT</span></Link>
          <p className="text-xs font-semibold">Admin</p>
          <button onClick={fetchAll} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex overflow-x-auto scrollbar-hide px-2 pb-2 gap-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.key} onClick={() => { setSection(item.key); setSearch(""); }}
              className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                section === item.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 md:pt-0 pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* ── HOME ── */}
          {section === "home" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-black">Good day, {user.name?.split(" ")[0] || "Admin"} 👋</h1>
                <p className="text-sm text-muted-foreground">Here's what's happening on KAT</p>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Revenue", value: formatNaira(totalRevenue), icon: <DollarSign className="w-4 h-4 text-primary" />, sub: `${orders.length} orders` },
                  { label: "Buyers", value: totalBuyers, icon: <Users className="w-4 h-4 text-primary" />, sub: "registered" },
                  { label: "Sellers", value: sellers.length, icon: <Store className="w-4 h-4 text-primary" />, sub: `${pendingSellers} pending` },
                  { label: "Products", value: products.length, icon: <Package className="w-4 h-4 text-primary" />, sub: "listed" },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-card-border rounded-2xl p-4">
                    {s.icon}
                    <p className="text-xl font-black mt-1">{s.value}</p>
                    <p className="text-xs font-semibold">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Marketplace health */}
              <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                <p className="font-bold text-sm">Marketplace Health</p>
                <div className="space-y-2">
                  {pendingSellers === 0 && pendingOrders === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <p className="text-sm font-semibold">🟢 All clear — marketplace is healthy</p>
                    </div>
                  ) : (
                    <>
                      {pendingSellers > 0 && (
                        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{pendingSellers} sellers waiting for verification</p>
                          </div>
                          <button onClick={() => setSection("sellers")} className="text-xs text-amber-700 font-bold underline">Review</button>
                        </div>
                      )}
                      {pendingOrders > 0 && (
                        <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            <p className="text-sm font-semibold text-red-700 dark:text-red-400">{pendingOrders} orders need attention</p>
                          </div>
                          <button onClick={() => setSection("orders")} className="text-xs text-red-700 font-bold underline">View</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Revenue chart */}
              <div className="bg-card border border-card-border rounded-2xl p-4">
                <p className="font-bold text-sm mb-4">Revenue — Last 7 Days</p>
                {totalRevenue === 0 ? (
                  <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">No revenue data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatNaira(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Recent orders */}
              <div className="bg-card border border-card-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-sm">Recent Orders</p>
                  <button onClick={() => setSection("orders")} className="text-xs text-primary font-semibold">View all</button>
                </div>
                {orders.slice(0, 5).map((o) => {
                  const cfg = ORDER_STATUS[o.admin_status || "pending"] || ORDER_STATUS.pending;
                  return (
                    <div key={o.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">#{o.id.slice(0, 8)} · {o.buyer_name || "Unknown"}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>{cfg.label}</span>
                      <p className="text-xs font-black text-primary shrink-0">{formatNaira(o.total || o.amount)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SELLERS ── */}
          {section === "sellers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">Sellers ({sellers.length})</h2>
                <div className="flex gap-1">
                  {["all", "pending", "approved"].map((f) => (
                    <button key={f} onClick={() => setSellerFilter(f)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize ${sellerFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
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
                <div className="space-y-3">
                  {filteredSellers.map((seller, i) => {
                    const status = seller.seller_verified ? "approved" : "pending";
                    const sellerProducts = products.filter((p) => p.seller_id === seller.id);
                    const sellerOrders = orders.filter((o) => o.seller_id === seller.id);
                    const sellerRevenue = sellerOrders.reduce((s, o) => s + (o.total || 0), 0);
                    return (
                      <motion.div key={seller.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-black text-primary">{(seller.full_name || seller.email || "?").slice(0, 2).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm">{seller.full_name || "Unnamed"}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                {status === "approved" ? "Verified" : "Pending"}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{seller.email}</p>
                            <div className="flex gap-3 mt-1">
                              <span className="text-[10px] text-muted-foreground">{sellerProducts.length} products</span>
                              <span className="text-[10px] text-muted-foreground">{sellerOrders.length} orders</span>
                              <span className="text-[10px] text-primary font-semibold">{formatNaira(sellerRevenue)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {status !== "approved" && (
                              <Button size="sm" onClick={() => approveSeller(seller.id)} disabled={actionLoading === seller.id}
                                className="rounded-full h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700">
                                <Check className="w-3 h-3 mr-1" /> Verify
                              </Button>
                            )}
                            {status === "approved" && (
                              <Button size="sm" variant="outline" onClick={() => rejectSeller(seller.id)} disabled={actionLoading === seller.id}
                                className="rounded-full h-8 px-3 text-xs border-destructive/40 text-destructive hover:bg-destructive/10">
                                <X className="w-3 h-3 mr-1" /> Revoke
                              </Button>
                            )}
                          </div>
                        </div>
                        {seller.store_name && (
                          <p className="text-xs text-muted-foreground">🏪 {seller.store_name}</p>
                        )}
                        <div className="flex gap-2">
                          <Link href={`/store/${seller.id}`}>
                            <Button size="sm" variant="outline" className="rounded-full text-xs h-7 gap-1">
                              <Eye className="w-3 h-3" /> View Store
                            </Button>
                          </Link>
                          <a href={`mailto:${seller.email}`}>
                            <Button size="sm" variant="outline" className="rounded-full text-xs h-7 gap-1">
                              <Mail className="w-3 h-3" /> Email
                            </Button>
                          </a>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {section === "products" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black">Products ({products.length})</h2>
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
                <div className="space-y-2">
                  {filteredProducts.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-center">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="w-14 h-14 rounded-xl object-cover shrink-0 bg-muted" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{p.title}</p>
                        <p className="text-xs text-primary font-bold">{formatNaira(p.price)}</p>
                        <div className="flex gap-2 mt-0.5">
                          {p.category && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{p.category}</span>}
                          {p.is_thrift && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Thrift</span>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Link href={`/listing/${p.id}`}>
                          <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        <button onClick={() => deleteProduct(p.id)} disabled={actionLoading === p.id}
                          className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ORDERS ── */}
          {section === "orders" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">Orders ({orders.length})</h2>
                <button onClick={fetchAll} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {["all", "pending", "assigned", "completed", "cancelled"].map((f) => {
                  const count = f === "all" ? orders.length : orders.filter((o) => (o.admin_status || "pending") === f).length;
                  return (
                    <button key={f} onClick={() => setOrderFilter(f)}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize ${orderFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                      {f} ({count})
                    </button>
                  );
                })}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="rounded-xl pl-9 h-9 text-sm" />
              </div>
              <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
                    <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold text-sm">No orders found</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const status = order.admin_status || "pending";
                    const cfg = ORDER_STATUS[status] || ORDER_STATUS.pending;
                    const isExpanded = expanded === order.id;
                    return (
                      <div key={order.id} className="bg-card border border-card-border rounded-2xl overflow-hidden">
                        <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpanded(isExpanded ? null : order.id)}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-mono text-[11px] text-muted-foreground">#{order.id.slice(0, 8)}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <p className="font-bold text-sm truncate">{order.buyer_name || "Unknown buyer"}</p>
                            <p className="text-[11px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <p className="font-black text-primary shrink-0">{formatNaira(order.total || order.amount)}</p>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        {isExpanded && (
                          <div className="border-t border-border p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-muted rounded-xl p-3">
                                <p className="text-[10px] text-muted-foreground mb-1">Buyer</p>
                                <p className="text-sm font-bold">{order.buyer_name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{order.buyer_phone || "—"}</p>
                              </div>
                              <div className="bg-muted rounded-xl p-3">
                                <p className="text-[10px] text-muted-foreground mb-1">Address</p>
                                <p className="text-xs font-semibold">{order.buyer_address || "—"}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {status !== "completed" && (
                                <Button size="sm" className="rounded-full text-xs" onClick={() => updateOrderStatus(order.id, "completed")} disabled={actionLoading === order.id}>
                                  Mark Completed
                                </Button>
                              )}
                              {status !== "cancelled" && (
                                <Button size="sm" variant="outline" className="rounded-full text-xs border-destructive/40 text-destructive" onClick={() => updateOrderStatus(order.id, "cancelled")} disabled={actionLoading === order.id}>
                                  Cancel Order
                                </Button>
                              )}
                              {status === "cancelled" && (
                                <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => updateOrderStatus(order.id, "pending")} disabled={actionLoading === order.id}>
                                  Reopen
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {section === "users" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black">Users ({users.length})</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="rounded-xl pl-9 h-9 text-sm" />
              </div>
              <div className="space-y-2">
                {filteredUsers.map((u, i) => (
                  <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-primary">{(u.full_name || u.email || "?").slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm">{u.full_name || "Unnamed"}</p>
                        {u.is_admin && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Admin</span>}
                        {u.is_seller && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Seller</span>}
                        {u.is_banned && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Banned</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                    {!u.is_admin && (
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => banUser(u.id, u.is_banned)} disabled={actionLoading === u.id}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${u.is_banned ? "bg-emerald-100 hover:bg-emerald-200" : "bg-amber-100 hover:bg-amber-200"}`}>
                          <Ban className={`w-3.5 h-3.5 ${u.is_banned ? "text-emerald-700" : "text-amber-700"}`} />
                        </button>
                        <button onClick={() => { if (window.confirm("Delete user?")) { supabase.from("profiles").delete().eq("id", u.id); setUsers((prev) => prev.filter((x) => x.id !== u.id)); } }}
                          className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {section === "analytics" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black">Analytics</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Revenue", value: formatNaira(totalRevenue) },
                  { label: "Total Orders", value: orders.length },
                  { label: "Avg Order Value", value: formatNaira(orders.length > 0 ? totalRevenue / orders.length : 0) },
                  { label: "Active Sellers", value: sellers.filter((s) => s.seller_verified).length },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-card-border rounded-2xl p-4">
                    <p className="text-xl font-black text-primary">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-card-border rounded-2xl p-4">
                <p className="font-bold text-sm mb-4">Daily Orders — Last 7 Days</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2">
                <p className="font-bold text-sm">Top Categories</p>
                {Object.entries(
                  products.reduce((acc: Record<string, number>, p) => {
                    acc[p.category || "Uncategorised"] = (acc[p.category || "Uncategorised"] || 0) + 1;
                    return acc;
                  }, {})
                ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{cat}</span>
                    <span className="text-sm font-bold">{count} products</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {section === "reports" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black">Reports & Safety</h2>
              <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
                <Flag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-sm">No reports yet</p>
                <p className="text-xs text-muted-foreground mt-1">Reported sellers and products will appear here</p>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {section === "settings" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black">Settings</h2>
              <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                <p className="text-sm font-bold">Platform Info</p>
                {[
                  { label: "Platform Name", value: "KAT Marketplace" },
                  { label: "Commission Rate", value: "5%" },
                  { label: "Support Contact", value: "support@kat.ng" },
                  { label: "Version", value: "MVP 1.0" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
  }

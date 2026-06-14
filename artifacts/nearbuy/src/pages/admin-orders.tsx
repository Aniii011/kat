import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, ShieldCheck, Package, MapPin, Phone,
  Search, ChevronDown, ChevronUp, Clock,
  Truck, CheckCircle, XCircle, User, Mail, RefreshCw, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminStatus = "pending" | "assigned" | "completed" | "cancelled";

const STATUS_CONFIG: Record<AdminStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", icon: <Clock className="w-3 h-3" /> },
  assigned:  { label: "Assigned",  color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400", icon: <Send className="w-3 h-3" /> },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400", icon: <XCircle className="w-3 h-3" /> },
};

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [buyers, setBuyers] = useState<Record<string, any>>({});
  const [sellers, setSellers] = useState<any[]>([]);
  const [filter, setFilter] = useState<AdminStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdmin = user?.isAdmin;

  const fetchAll = async () => {
    setLoading(true);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersData) {
      setOrders(ordersData);

      const productIds = Array.from(new Set(ordersData.map((o) => o.product_id).filter(Boolean)));
      const buyerIds = Array.from(new Set(ordersData.map((o) => o.buyer_id).filter(Boolean)));

      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, title, image_url, seller_id")
          .in("id", productIds);
        if (productsData) {
          const map: Record<string, any> = {};
          productsData.forEach((p) => { map[p.id] = p; });
          setProducts(map);
        }
      }

      if (buyerIds.length > 0) {
        const { data: buyersData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", buyerIds);
        if (buyersData) {
          const map: Record<string, any> = {};
          buyersData.forEach((b) => { map[b.id] = b; });
          setBuyers(map);
        }
      }
    }

    const { data: sellersData } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("seller_verified", true);
    if (sellersData) setSellers(sellersData);

    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchAll();
  }, [isAdmin]);

  const assignToSeller = async (orderId: string, sellerId: string) => {
    setActionLoading(orderId);
    await supabase
      .from("orders")
      .update({
        seller_id: sellerId,
        assigned_to_seller: true,
        admin_status: "assigned",
        seller_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId
      ? { ...o, seller_id: sellerId, assigned_to_seller: true, admin_status: "assigned", seller_status: "pending" }
      : o
    ));
    setActionLoading(null);
  };

  const updateAdminStatus = async (orderId: string, status: AdminStatus) => {
    setActionLoading(orderId);
    await supabase
      .from("orders")
      .update({ admin_status: status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, admin_status: status } : o));
    setActionLoading(null);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-black mb-2">Admin Access Only</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">This area is restricted to KAT administrators.</p>
        <Link href="/"><Button variant="outline" className="rounded-full">Back to Home</Button></Link>
      </div>
    );
  }

  const filtered = orders.filter((o) => {
    const status: AdminStatus = (o.admin_status || "pending") as AdminStatus;
    const matchStatus = filter === "all" || status === filter;
    const buyer = buyers[o.buyer_id];
    const matchSearch = !search || [o.id, buyer?.full_name, buyer?.email, o.buyer_address]
      .some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => (o.admin_status || "pending") === "pending").length,
    assigned: orders.filter((o) => o.admin_status === "assigned").length,
    completed: orders.filter((o) => o.admin_status === "completed").length,
    cancelled: orders.filter((o) => o.admin_status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/admin/sellers">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-black flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" /> Order Management
            </h1>
            <p className="text-[11px] text-muted-foreground">Admin Panel · KAT Delivery Control</p>
          </div>
          <button
            onClick={fetchAll}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 pb-24 space-y-4">

        {/* Status filter strip */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(["all", "pending", "assigned", "completed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full font-semibold border transition-all whitespace-nowrap ${
                filter === s
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {s === "all" ? "All Orders" : STATUS_CONFIG[s].label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center ${
                filter === s ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by buyer name, email, address..."
            className="rounded-xl pl-9 h-9 text-sm"
          />
        </div>

        {/* Orders list */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No orders found</p>
            </div>
          ) : (
            filtered.map((order, i) => {
              const status: AdminStatus = (order.admin_status || "pending") as AdminStatus;
              const cfg = STATUS_CONFIG[status];
              const isExpanded = expanded === order.id;
              const product = products[order.product_id];
              const buyer = buyers[order.buyer_id];

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-card-border rounded-2xl overflow-hidden"
                >
                  <div
                    className="p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                  >
                    {product?.image_url ? (
                      <img src={product.image_url} alt={product.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-mono text-[11px] text-muted-foreground">{order.id.slice(0, 8)}</p>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <p className="font-bold text-sm truncate">{product?.title || "Product"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {buyer?.full_name || buyer?.email || "Unknown buyer"} · {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-primary">{formatNaira(order.total || order.amount)}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border overflow-hidden"
                      >
                        <div className="p-4 space-y-4">

                          {/* Buyer info */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="bg-muted/50 rounded-xl p-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> Buyer
                              </p>
                              <p className="text-sm font-bold truncate">{order.buyer_name || buyer?.full_name || "—"}</p>
                            </div>
                            <div className="bg-muted/50 rounded-xl p-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Phone
                              </p>
                              <p className="text-sm font-bold truncate">{order.buyer_phone || "—"}</p>
                            </div>
                            <div className="bg-muted/50 rounded-xl p-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                              </p>
                              <p className="text-sm font-bold truncate">{buyer?.email || "—"}</p>
                            </div>
                          </div>

                          {/* Address */}
                          <div className="bg-muted/50 rounded-xl p-3">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Delivery Address
                            </p>
                            <p className="text-sm font-bold">{order.buyer_address || "No address provided"}</p>
                          </div>

                          {/* Order summary */}
                          <div className="rounded-xl border border-border overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2.5">
                              <div>
                                <p className="text-sm font-medium">{product?.title || "Product"}</p>
                                <p className="text-xs text-muted-foreground">Qty: {order.quantity || 1}</p>
                                {order.variant && (
                                  <p className="text-xs text-muted-foreground">
                                    Variant: {[order.variant.color, order.variant.size, order.variant.shoeSize].filter(Boolean).join(" / ")}
                                  </p>
                                )}
                              </div>
                              <span className="font-bold text-sm shrink-0">{formatNaira(order.total || order.amount)}</span>
                            </div>
                            <div className="flex justify-between items-center px-3 py-2.5 border-t-2 border-border bg-muted/50">
                              <span className="font-bold">Total</span>
                              <span className="font-black text-primary text-base">{formatNaira(order.total || order.amount)}</span>
                            </div>
                          </div>

                          {/* Assign to seller */}
                          <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                              <Send className="w-3 h-3" /> Assign to Seller
                            </p>
                            {order.assigned_to_seller ? (
                              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold">
                                    {sellers.find((s) => s.id === order.seller_id)?.full_name || "Assigned seller"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Seller status: {order.seller_status || "pending"}
                                  </p>
                                </div>
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {sellers
                                  .filter((s) => !product?.seller_id || s.id === product.seller_id)
                                  .map((s) => (
                                    <Button
                                      key={s.id}
                                      size="sm"
                                      className="rounded-full text-xs"
                                      disabled={actionLoading === order.id}
                                      onClick={() => assignToSeller(order.id, s.id)}
                                    >
                                      Assign to {s.full_name || s.email}
                                    </Button>
                                  ))}
                                {sellers.filter((s) => !product?.seller_id || s.id === product.seller_id).length === 0 && (
                                  <p className="text-xs text-muted-foreground">No matching verified sellers found.</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Admin status actions */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {status !== "completed" && (
                              <Button
                                size="sm"
                                className="rounded-full gap-1 text-xs font-semibold"
                                disabled={actionLoading === order.id}
                                onClick={() => updateAdminStatus(order.id, "completed")}
                              >
                                Mark as Completed
                              </Button>
                            )}
                            {status !== "cancelled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                                disabled={actionLoading === order.id}
                                onClick={() => updateAdminStatus(order.id, "cancelled")}
                              >
                                Cancel Order
                              </Button>
                            )}
                            {status === "cancelled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full text-xs"
                                disabled={actionLoading === order.id}
                                onClick={() => updateAdminStatus(order.id, "pending")}
                              >
                                Reopen Order
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground pt-2">
          Showing {filtered.length} of {orders.length} orders ·{" "}
          <span className="text-amber-600 font-semibold">{counts.pending} pending</span>
          {counts.assigned > 0 && <span className="text-blue-600"> · {counts.assigned} assigned</span>}
        </p>
      </main>
    </div>
  );
}

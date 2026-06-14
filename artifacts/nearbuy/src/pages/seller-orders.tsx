import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft, ShoppingCart, Lock, LogIn, Package,
  Truck, CheckCircle2, Clock, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

const SELLER_STATUSES = ["pending", "processing", "shipped", "delivered"] as const;
type SellerStatus = (typeof SELLER_STATUSES)[number];

const STATUS_CONFIG: Record<SellerStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", icon: <Clock className="w-3 h-3" /> },
  processing: { label: "Processing", className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400", icon: <Package className="w-3 h-3" /> },
  shipped: { label: "Shipped", className: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400", icon: <Truck className="w-3 h-3" /> },
  delivered: { label: "Delivered", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", icon: <CheckCircle2 className="w-3 h-3" /> },
};

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<SellerStatus | "all">("all");

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("seller_id", user.id)
      .eq("assigned_to_seller", true)
      .order("created_at", { ascending: false });

    if (ordersData) {
      setOrders(ordersData);

      const productIds = Array.from(new Set(ordersData.map((o) => o.product_id).filter(Boolean)));
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, title, image_url")
          .in("id", productIds);

        if (productsData) {
          const map: Record<string, any> = {};
          productsData.forEach((p) => { map[p.id] = p; });
          setProducts(map);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const updateStatus = async (orderId: string, status: SellerStatus) => {
    setUpdating(orderId);
    await supabase
      .from("orders")
      .update({ seller_status: status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, seller_status: status } : o));
    setUpdating(null);
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
        </p>
        <Link href="/"><Button variant="outline" className="rounded-full mt-2">Go Home</Button></Link>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) =>
    filter === "all" ? true : (o.seller_status || "pending") === filter
  );

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => (o.seller_status || "pending") === "pending").length,
    processing: orders.filter((o) => o.seller_status === "processing").length,
    shipped: orders.filter((o) => o.seller_status === "shipped").length,
    delivered: orders.filter((o) => o.seller_status === "delivered").length,
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/seller">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-black flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" /> My Orders
            </h1>
          </div>
          <button
            onClick={fetchOrders}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {(["all", ...SELLER_STATUSES] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
            <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold text-sm">No orders {filter !== "all" ? `with status "${filter}"` : "yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Orders assigned to you by KAT admins will appear here.
            </p>
          </div>
        ) : (
          filteredOrders.map((order, i) => {
            const product = products[order.product_id];
            const status: SellerStatus = (order.seller_status || "pending") as SellerStatus;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-card-border rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  {product?.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product?.title || "Product"}</p>
                    <p className="text-xs text-primary font-bold mt-0.5">
                      {formatNaira(order.total || order.amount)}
                    </p>
                    {order.quantity && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">Qty: {order.quantity}</p>
                    )}
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${STATUS_CONFIG[status].className}`}>
                    {STATUS_CONFIG[status].icon} {STATUS_CONFIG[status].label}
                  </span>
                </div>

                {order.variant && (
                  <div className="text-xs text-muted-foreground bg-muted rounded-xl p-2">
                    Variant: {[order.variant.color, order.variant.size, order.variant.shoeSize].filter(Boolean).join(" / ")}
                  </div>
                )}

                {(order.buyer_name || order.buyer_address || order.buyer_phone) && (
                  <div className="text-xs text-muted-foreground bg-muted rounded-xl p-2 space-y-0.5">
                    {order.buyer_name && <p><span className="font-semibold">Buyer:</span> {order.buyer_name}</p>}
                    {order.buyer_phone && <p><span className="font-semibold">Phone:</span> {order.buyer_phone}</p>}
                    {order.buyer_address && <p><span className="font-semibold">Address:</span> {order.buyer_address}</p>}
                  </div>
                )}

                <div className="flex gap-1.5 flex-wrap">
                  {SELLER_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(order.id, s)}
                      disabled={updating === order.id || status === s}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                        status === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Order placed {new Date(order.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            );
          })
        )}
      </main>
    </div>
  );
}

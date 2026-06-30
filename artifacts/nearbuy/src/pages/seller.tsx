import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import {
  Home, Package, ShoppingCart, Megaphone, FileText,
  TrendingUp, BarChart2, DollarSign, Settings, LogIn, Lock,
  Plus, Bell, ChevronRight, AlertCircle, Star, Truck,
  Clock, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

type SellerSection = "home" | "products" | "orders" | "promotions" | "statements" | "settings";

const NAV_ITEMS: { key: SellerSection; label: string; icon: React.ReactNode }[] = [
  { key: "home", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
  { key: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
  { key: "orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" /> },
  { key: "promotions", label: "Promotions", icon: <Megaphone className="w-4 h-4" /> },
  { key: "statements", label: "Account Statements", icon: <FileText className="w-4 h-4" /> },
  { key: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

export default function Seller() {
  const { user } = useAuth();
  const [section, setSection] = useState<SellerSection>("home");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
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
          Hi {user.name}, your account is not yet approved as a verified KAT seller.
          Contact us at <span className="text-primary font-semibold">sellers@kat.com</span> to apply.
        </p>
        <Link href="/"><Button variant="outline" className="rounded-full mt-2">Go Home</Button></Link>
      </div>
    );
  }

  // Computed stats
  const revenue = orders.reduce((s, o) => s + (o.total || o.amount || 0), 0);
  const pendingOrders = orders.filter((o) => (o.seller_status || "pending") === "pending");
  const toShip = orders.filter((o) => o.seller_status === "processing");
  const activeProducts = products.filter((p) => p.is_active !== false);
  const incompleteProducts = products.filter((p) => !p.title || !p.price || !p.image_url);

  return (
    <div className="min-h-screen bg-background flex">

      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-card border-r border-border min-h-screen sticky top-0 hidden md:flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/">
            <span className="text-xl font-black text-primary cursor-pointer">KAT</span>
          </Link>
          <p className="text-[10px] text-muted-foreground mt-0.5">Seller Center</p>
        </div>

        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-primary">
                {(user.name || user.email || "KA").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{user.name || "Seller"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                section === item.key
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.label}
              {item.key === "orders" && pendingOrders.length > 0 && (
                <span className="ml-auto bg-destructive text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <Link href="/me">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to KAT
            </button>
          </Link>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/"><span className="text-lg font-black text-primary">KAT</span></Link>
          <p className="text-xs font-semibold">Seller Center</p>
          <button onClick={fetchAll} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex overflow-x-auto scrollbar-hide px-2 pb-2 gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                section === item.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6">

          {section === "home" && (
            <SellerHomeSection
              user={user}
              products={products}
              orders={orders}
              pendingOrders={pendingOrders}
              toShip={toShip}
              incompleteProducts={incompleteProducts}
              revenue={revenue}
              onNavigate={setSection}
              loading={loading}
            />
          )}

          {section === "products" && (
            <SellerProductsSection
              products={products}
              setProducts={setProducts}
              user={user}
              refetch={fetchAll}
            />
          )}

          {section === "orders" && (
            <SellerOrdersSection
              orders={orders}
              setOrders={setOrders}
            />
          )}

          {section === "promotions" && (
            <div className="text-center py-20">
              <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-bold text-sm">No active promotions</p>
              <p className="text-xs text-muted-foreground mt-1">Coupon and discount tools coming soon.</p>
            </div>
          )}

          {section === "statements" && (
            <SellerStatementsSection orders={orders} revenue={revenue} />
          )}

          {section === "settings" && (
            <div className="text-center py-20">
              <Settings className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-bold text-sm">Store settings</p>
              <p className="text-xs text-muted-foreground mt-1">Store name and branding tools coming soon.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────
// HOME / DASHBOARD SECTION
// ─────────────────────────────────────────
function SellerHomeSection({
  user, products, orders, pendingOrders, toShip, incompleteProducts, revenue, onNavigate, loading,
}: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">
          Hey there, here's a summary of where {user.name || "your store"} is at
        </h1>
      </div>

      {/* To-do cards */}
      <div>
        <p className="text-sm font-bold mb-3">Yours to do</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {products.length === 0 && (
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <p className="text-sm font-bold mb-1">Available products ({products.length})</p>
              <p className="text-xs text-muted-foreground mb-3">List products to start selling on KAT</p>
              <Button size="sm" className="rounded-full text-xs" onClick={() => onNavigate("products")}>
                Create Products
              </Button>
            </div>
          )}

          {incompleteProducts.length > 0 && (
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <p className="text-sm font-bold mb-1">Incomplete listings ({incompleteProducts.length})</p>
              <p className="text-xs text-muted-foreground mb-3">Finish setting these up so buyers can find them</p>
              <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => onNavigate("products")}>
                Review Listings
              </Button>
            </div>
          )}

          {pendingOrders.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <p className="text-sm font-bold mb-1 text-amber-700 dark:text-amber-400">
                Pending orders ({pendingOrders.length})
              </p>
              <p className="text-xs text-muted-foreground mb-3">These orders need to be processed</p>
              <Button size="sm" className="rounded-full text-xs" onClick={() => onNavigate("orders")}>
                Process Orders
              </Button>
            </div>
          )}

          {toShip.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
              <p className="text-sm font-bold mb-1 text-blue-700 dark:text-blue-400">
                Ready to ship ({toShip.length})
              </p>
              <p className="text-xs text-muted-foreground mb-3">Mark these as shipped once sent</p>
              <Button size="sm" className="rounded-full text-xs" onClick={() => onNavigate("orders")}>
                Ship Orders
              </Button>
            </div>
          )}

          {products.length > 0 && pendingOrders.length === 0 && toShip.length === 0 && incompleteProducts.length === 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 sm:col-span-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">You're all caught up!</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">No pending actions right now.</p>
            </div>
          )}
        </div>
      </div>

      {/* Business metrics */}
      <div>
        <p className="text-sm font-bold mb-3">Business Metrics</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Revenue", value: formatNaira(revenue), icon: <DollarSign className="w-4 h-4 text-primary" /> },
            { label: "Orders", value: orders.length, icon: <ShoppingCart className="w-4 h-4 text-primary" /> },
            { label: "Products Live", value: products.length, icon: <Package className="w-4 h-4 text-primary" /> },
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

      {/* Seller score placeholder */}
      <div className="bg-card border border-card-border rounded-2xl p-4">
        <p className="text-sm font-bold mb-3">Seller Score</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Order fulfillment rate</p>
            <p className="text-lg font-black text-emerald-600">
              {orders.length > 0
                ? `${Math.round((orders.filter((o: any) => o.seller_status === "delivered").length / orders.length) * 100)}%`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Response time</p>
            <p className="text-lg font-black">—</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// PRODUCTS TABLE SECTION (built next message)
// ─────────────────────────────────────────
function SellerProductsSection({ products, setProducts, user, refetch }: any) {
  return (
    <div className="text-center py-20">
      <p className="text-sm text-muted-foreground">Products table coming in next step...</p>
    </div>
  );
}

// ─────────────────────────────────────────
// ORDERS SECTION (built next message)
// ─────────────────────────────────────────
function SellerOrdersSection({ orders, setOrders }: any) {
  return (
    <div className="text-center py-20">
      <p className="text-sm text-muted-foreground">Orders section coming in next step...</p>
    </div>
  );
}

// ─────────────────────────────────────────
// STATEMENTS SECTION
// ─────────────────────────────────────────
function SellerStatementsSection({ orders, revenue }: any) {
  const commission = revenue * 0.05;
  const netEarnings = revenue - commission;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black">Account Statements</h2>
      <div className="bg-card border border-card-border rounded-2xl p-5 space-y-3">
        {[
          { label: "Gross Revenue", value: formatNaira(revenue) },
          { label: "KAT Commission (5%)", value: `-${formatNaira(commission)}`, negative: true },
          { label: "Net Earnings", value: formatNaira(netEarnings), bold: true },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <p className="text-sm text-muted-foreground">{row.label}</p>
            <p className={`text-sm font-bold ${row.negative ? "text-destructive" : ""} ${row.bold ? "text-primary text-base" : ""}`}>
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
   }

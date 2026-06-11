import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, ShieldCheck, Check, X, Store,
  Mail, Calendar, Search, Truck, Trash2,
  Package, Users, TrendingUp, RefreshCw,
  Ban, Eye, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminTab = "sellers" | "products" | "users";
type SellerStatus = "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<SellerStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
};

export default function AdminSellers() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("sellers");
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SellerStatus | "all">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSellers: 0,
    pendingSellers: 0,
    totalProducts: 0,
    totalUsers: 0,
  });

  const isAdmin = user?.isAdmin;

  useEffect(() => {
    if (!isAdmin) return;
    fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchSellers(), fetchProducts(), fetchUsers()]);
    setLoading(false);
  };

  const fetchSellers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setSellers(data);
      setStats((prev) => ({
        ...prev,
        totalSellers: data.filter((s) => s.is_seller).length,
        pendingSellers: data.filter((s) => s.is_seller && !s.seller_verified).length,
      }));
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setProducts(data);
      setStats((prev) => ({ ...prev, totalProducts: data.length }));
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setUsers(data);
      setStats((prev) => ({ ...prev, totalUsers: data.length }));
    }
  };

  const approveSeller = async (id: string) => {
    setActionLoading(id);
    await supabase
      .from("profiles")
      .update({ seller_verified: true, is_seller: true })
      .eq("id", id);
    await fetchSellers();
    setActionLoading(null);
  };

  const rejectSeller = async (id: string) => {
    setActionLoading(id);
    await supabase
      .from("profiles")
      .update({ seller_verified: false, is_seller: false })
      .eq("id", id);
    await fetchSellers();
    setActionLoading(null);
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    setActionLoading(id);
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setActionLoading(null);
  };

  const banUser = async (id: string, banned: boolean) => {
    setActionLoading(id);
    await supabase
      .from("profiles")
      .update({ is_banned: !banned })
      .eq("id", id);
    await fetchUsers();
    setActionLoading(null);
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    setActionLoading(id);
    await supabase.from("profiles").delete().eq("id", id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setActionLoading(null);
  };

  const formatNaira = (n: number) => "₦" + Number(n || 0).toLocaleString("en-NG");

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-black mb-2">Admin Access Only</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          This area is restricted to KAT administrators.
        </p>
        <Link href="/">
          <Button variant="outline" className="rounded-full">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const filteredSellers = sellers.filter((s) => {
    const matchSearch = !search ||
      [s.full_name, s.email].some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    const status = s.seller_verified ? "approved" : s.is_seller ? "pending" : "rejected";
    const matchFilter = filter === "all" || status === filter;
    return matchSearch && matchFilter && s.is_seller;
  });

  const filteredProducts = products.filter((p) =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter((u) =>
    !search || [u.full_name, u.email].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-black flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Admin Panel
            </h1>
            <p className="text-[11px] text-muted-foreground">KAT Marketplace</p>
          </div>
          <button
            onClick={fetchAll}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/admin/orders">
            <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs font-semibold shrink-0">
              <Truck className="w-3.5 h-3.5" /> Orders
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 pb-24 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: <Store className="w-4 h-4 text-primary" />, label: "Sellers", value: stats.totalSellers },
            { icon: <AlertCircle className="w-4 h-4 text-amber-500" />, label: "Pending", value: stats.pendingSellers },
            { icon: <Package className="w-4 h-4 text-primary" />, label: "Products", value: stats.totalProducts },
            { icon: <Users className="w-4 h-4 text-primary" />, label: "Users", value: stats.totalUsers },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-card-border rounded-2xl p-3 flex flex-col gap-1">
              {stat.icon}
              <p className="text-xl font-black">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-2xl">
          {([
            { key: "sellers", label: "Sellers", icon: <Store className="w-3.5 h-3.5" /> },
            { key: "products", label: "Products", icon: <Package className="w-3.5 h-3.5" /> },
            { key: "users", label: "Users", icon: <Users className="w-3.5 h-3.5" /> },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-background shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="rounded-xl pl-9 h-9 text-sm"
          />
        </div>

        {/* Sellers Tab */}
        {activeTab === "sellers" && (
          <div className="space-y-3">
            {/* Filter */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== "all" && (
                    <span className="ml-1">
                      ({sellers.filter((s) => {
                        const status = s.seller_verified ? "approved" : s.is_seller ? "pending" : "rejected";
                        return status === f && s.is_seller;
                      }).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
            ) : filteredSellers.length === 0 ? (
              <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
                <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-sm">No sellers found</p>
              </div>
            ) : (
              filteredSellers.map((seller, i) => {
                const status: SellerStatus = seller.seller_verified
                  ? "approved"
                  : seller.is_seller
                  ? "pending"
                  : "rejected";
                return (
                  <motion.div
                    key={seller.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card border border-card-border rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm">{seller.full_name || "Unnamed"}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[status].className}`}>
                            {STATUS_CONFIG[status].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Mail className="w-3 h-3" /> {seller.email}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(seller.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {status !== "approved" && (
                          <Button
                            size="sm"
                            onClick={() => approveSeller(seller.id)}
                            disabled={actionLoading === seller.id}
                            className="rounded-full h-8 px-3 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </Button>
                        )}
                        {status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectSeller(seller.id)}
                            disabled={actionLoading === seller.id}
                            className="rounded-full h-8 px-3 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                          >
                            <X className="w-3 h-3" /> {status === "approved" ? "Revoke" : "Reject"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-sm">No products found</p>
              </div>
            ) : (
              filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-center"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product.title}</p>
                    <p className="text-xs text-primary font-bold">
                      {formatNaira(product.price)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Seller ID: {product.seller_id?.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => deleteProduct(product.id)}
                      disabled={actionLoading === product.id}
                      className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-sm">No users found</p>
              </div>
            ) : (
              filteredUsers.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-card-border rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-primary">
                        {(u.full_name || u.email || "?").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm">{u.full_name || "Unnamed"}</p>
                        {u.is_admin && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Admin
                          </span>
                        )}
                        {u.is_seller && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Seller
                          </span>
                        )}
                        {u.is_banned && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            Banned
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{u.email}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {!u.is_admin && (
                        <>
                          <button
                            onClick={() => banUser(u.id, u.is_banned)}
                            disabled={actionLoading === u.id}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              u.is_banned
                                ? "bg-emerald-100 hover:bg-emerald-200"
                                : "bg-amber-100 hover:bg-amber-200"
                            }`}
                            title={u.is_banned ? "Unban user" : "Ban user"}
                          >
                            <Ban className={`w-3.5 h-3.5 ${u.is_banned ? "text-emerald-700" : "text-amber-700"}`} />
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            disabled={actionLoading === u.id}
                            className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

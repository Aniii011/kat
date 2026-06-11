import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import ThemeSwitcher from "@/components/theme-switcher";
import { useAuth } from "@/context/auth-context";
import AuthModal from "@/components/auth-modal";
import {
  ArrowLeft,
  Plus,
  Package,
  ShoppingCart,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Zap,
  BarChart3,
  ChevronRight,
  Upload,
  Clock,
  Lock,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

export default function Seller() {
  const { user } = useAuth();

  const [showAuth, setShowAuth] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // REAL DATA PLACEHOLDERS (NO FAKE DATA)
  const myProducts: any[] = [];
  const orders: any[] = [];

  // STATS (REAL SAFE VERSION)
  const stats = [
    { label: "Products", value: myProducts.length, icon: <Package className="w-4 h-4" /> },
    { label: "Orders", value: orders.length, icon: <ShoppingCart className="w-4 h-4" /> },
    { label: "Revenue", value: "₦0", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Views", value: 0, icon: <Eye className="w-4 h-4" /> },
  ];

  // ───────── AUTH GATE ─────────
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <LogIn className="w-10 h-10 mb-3 text-primary" />
        <h1 className="text-xl font-bold">Sign in required</h1>
        <p className="text-sm text-muted-foreground mb-4">
          You need to be logged in to access Seller Dashboard.
        </p>

        <Button onClick={() => setShowAuth(true)} className="rounded-full">
          Sign In
        </Button>

        <Link href="/" className="mt-3">
          <Button variant="ghost">Back Home</Button>
        </Link>

        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    );
  }

  // ───────── SELLER GATE ─────────
  if (!user.sellerVerified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-10 h-10 mb-3 text-amber-500" />
        <h1 className="text-xl font-bold">Seller Access Required</h1>

        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          Your account is not approved as a seller yet.
        </p>

        <div className="flex gap-2">
          <Link href="/">
            <Button>Back to Shop</Button>
          </Link>
        </div>

        {user.isAdmin && (
          <Link href="/admin/sellers" className="mt-4">
            <Button variant="ghost" className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              Admin Panel
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/me">
            <Button size="icon" variant="ghost">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div className="flex-1">
            <h1 className="font-bold">Seller Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              Manage your store
            </p>
          </div>

          <ThemeSwitcher />

          <Button
            size="sm"
            className="rounded-full gap-2"
            onClick={() => setShowUpload(true)}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 py-5 space-y-6">
        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl border bg-card"
            >
              <div className="mb-2 text-primary">{s.icon}</div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* EMPTY STATE BANNER */}
        <div className="border rounded-2xl p-4 text-sm text-muted-foreground">
          No real data yet. Connect Supabase to start tracking products, orders, and revenue.
        </div>

        {/* TABS */}
        <Tabs defaultValue="products">
          <TabsList className="w-full">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* PRODUCTS */}
          <TabsContent value="products" className="mt-4">
            {myProducts.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No products yet. Click “Add Product” to start selling.
              </div>
            ) : (
              <div />
            )}
          </TabsContent>

          {/* ORDERS */}
          <TabsContent value="orders" className="mt-4">
            {orders.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No orders yet.
              </div>
            ) : (
              <div />
            )}
          </TabsContent>

          {/* ANALYTICS */}
          <TabsContent value="analytics" className="mt-4">
            <div className="text-center py-10 text-sm text-muted-foreground">
              Analytics will appear once you connect real sales data.
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* UPLOAD MODAL */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Add Product
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input placeholder="Product title" />
            <Textarea placeholder="Description" />
            <Input placeholder="Price" type="number" />

            <Button className="w-full rounded-full">
              Save Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

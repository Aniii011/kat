import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { listings as staticListings } from "@/data/listings";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  ArrowLeft, Plus, Package, ShoppingCart, TrendingUp,
  Eye, Edit, Trash2, Zap, BarChart3, ChevronRight,
  Upload, Star, BadgeCheck, Clock, Truck, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

const myProducts = staticListings.slice(0, 6);

const MOCK_ORDERS = [
  { id: "KAT-8821", buyer: "Chidinma O.", item: "Ankara Co-ord Blazer", amount: 18500, status: "Shipped", date: "May 18" },
  { id: "KAT-9901", buyer: "Blessing N.", item: "Baddie Bodycon Slit Dress", amount: 12000, status: "Pending", date: "May 22" },
  { id: "KAT-7712", buyer: "Funmi B.", item: "Lace Front Wig", amount: 48000, status: "Delivered", date: "May 10" },
];

const STATUS = { Shipped: "bg-blue-100 text-blue-700", Pending: "bg-amber-100 text-amber-700", Delivered: "bg-emerald-100 text-emerald-700" };

export default function Seller() {
  const [showUpload, setShowUpload] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const stats = [
    { label: "Products", value: myProducts.length, icon: <Package className="w-4 h-4" />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Total Orders", value: 28, icon: <ShoppingCart className="w-4 h-4" />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Revenue", value: "₦847K", icon: <TrendingUp className="w-4 h-4" />, color: "text-primary", bg: "bg-primary/10" },
    { label: "Profile Views", value: "12.4K", icon: <Eye className="w-4 h-4" />, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/me">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-black">Seller Dashboard</h1>
            <p className="text-[11px] text-muted-foreground">Manage your KAT store</p>
          </div>
          <ThemeSwitcher />
          <Button size="sm" className="rounded-full gap-1.5 font-semibold" onClick={() => setShowUpload(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Product
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 pb-24 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-card border border-card-border rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Boost banner */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/30 border border-primary/20 rounded-3xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Boost your products</p>
            <p className="text-xs text-muted-foreground">Reach 10x more buyers — pay when you sell</p>
          </div>
          <Button size="sm" className="rounded-full shrink-0 font-semibold gap-1">
            Boost <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="rounded-full bg-muted p-1 h-auto w-full">
            <TabsTrigger value="products" className="rounded-full flex-1 text-xs">Products</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-full flex-1 text-xs">Orders</TabsTrigger>
            <TabsTrigger value="thrift" className="rounded-full flex-1 text-xs">Thrift Items</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-full flex-1 text-xs">Analytics</TabsTrigger>
          </TabsList>

          {/* Products tab */}
          <TabsContent value="products" className="mt-4 space-y-3">
            {myProducts.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-center">
                <img src={p.imageUrl} alt={p.title} className="w-14 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-black text-primary">{formatNaira(p.price)}</span>
                    <span className="text-[10px] text-muted-foreground">{p.stockCount} in stock</span>
                    <span className="text-[10px] text-muted-foreground">{p.sold} sold</span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button className="w-8 h-8 rounded-xl bg-muted hover:bg-accent flex items-center justify-center transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-8 h-8 rounded-xl bg-muted hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          {/* Orders tab */}
          <TabsContent value="orders" className="mt-4 space-y-3">
            {MOCK_ORDERS.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-card border border-card-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{o.id}</p>
                    <p className="text-sm font-semibold">{o.item}</p>
                    <p className="text-xs text-muted-foreground">Buyer: {o.buyer} · {o.date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS[o.status as keyof typeof STATUS]}`}>{o.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-primary">{formatNaira(o.amount)}</span>
                  <Button size="sm" variant="outline" className="rounded-full text-xs h-7">
                    {o.status === "Pending" ? "Ship Now" : "View Details"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          {/* Thrift tab */}
          <TabsContent value="thrift" className="mt-4">
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 mb-4">
              <p className="font-bold text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Thrift Drop Rules
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Each thrift item is one-of-one. Items refresh hourly. First buyer to pay deposit secures the item.
              </p>
            </div>
            {staticListings.filter((l) => l.isThrift).map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 mb-3">
                <img src={l.imageUrl} alt={l.title} className="w-14 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{l.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black text-primary">{formatNaira(l.price)}</span>
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full">Deposit: {l.depositAmount ? formatNaira(l.depositAmount) : "–"}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full inline-block mt-1">Available</span>
                </div>
                <button className="w-8 h-8 rounded-xl bg-muted hover:bg-accent flex items-center justify-center transition-colors shrink-0">
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
            <Button variant="outline" className="w-full rounded-2xl gap-2 border-purple-300 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20">
              <Plus className="w-4 h-4" /> Add Thrift Item
            </Button>
          </TabsContent>

          {/* Analytics tab */}
          <TabsContent value="analytics" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Views this week", value: "3,420", change: "+18%" },
                { label: "Conversion rate", value: "4.2%", change: "+0.8%" },
                { label: "Avg order value", value: "₦24,300", change: "+₦2,100" },
                { label: "Return rate", value: "2.1%", change: "-0.4%" },
              ].map((m) => (
                <div key={m.label} className="bg-card border border-card-border rounded-2xl p-4">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-black mt-1">{m.value}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">{m.change} this week</p>
                </div>
              ))}
            </div>
            <div className="bg-card border border-card-border rounded-2xl p-4 mt-3">
              <p className="font-bold text-sm mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Top performing products</p>
              {myProducts.slice(0, 3).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="flex-1 text-xs font-medium truncate">{p.title}</p>
                  <span className="text-xs font-bold text-primary shrink-0">{p.sold} sold</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Upload product dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" /> Add New Product
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload photos</p>
              <p className="text-[10px] text-muted-foreground mt-1">Up to 8 images, max 5MB each</p>
            </div>
            <Input placeholder="Product title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="rounded-xl" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Price (₦)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="rounded-xl" type="number" />
              <Input placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="rounded-xl" />
            </div>
            <Button className="w-full rounded-full font-bold" onClick={() => setShowUpload(false)}>
              List Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

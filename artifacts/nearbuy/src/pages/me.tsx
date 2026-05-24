import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import ThemeSwitcher from "@/components/theme-switcher";
import { useTheme, type AppTheme } from "@/context/theme-context";
import {
  Package, MapPin, Star, RotateCcw, Tag, HelpCircle,
  LogOut, ChevronRight, Edit3, Check, Shield,
  Truck, Clock, X, Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const MOCK_ORDERS = [
  { id: "KAT-8821", items: "Ankara Co-ord Blazer & Wide-Leg Set", amount: 18500, status: "Delivered", date: "May 10, 2025", image: "https://picsum.photos/seed/f1/40/40" },
  { id: "KAT-7743", items: "Brazilian Body Wave Lace Front Wig", amount: 48000, status: "Shipped", date: "May 18, 2025", image: "https://picsum.photos/seed/f4/40/40" },
  { id: "KAT-6612", items: "Gym Set – Sports Bra & Leggings", amount: 19500, status: "Pending", date: "May 22, 2025", image: "https://picsum.photos/seed/f12/40/40" },
  { id: "KAT-5501", items: "Soft Girl Satin Slip Pyjama Set", amount: 14000, status: "Cancelled", date: "Apr 30, 2025", image: "https://picsum.photos/seed/f10/40/40" },
];

const STATUS_STYLES: Record<string, string> = {
  Delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  Shipped: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Delivered: <Check className="w-3 h-3" />,
  Shipped: <Truck className="w-3 h-3" />,
  Pending: <Clock className="w-3 h-3" />,
  Cancelled: <X className="w-3 h-3" />,
};

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

const THEME_OPTIONS: { value: AppTheme; label: string; swatch: string }[] = [
  { value: "light", label: "Light", swatch: "#fdf2f8" },
  { value: "dark", label: "Dark", swatch: "#0f0f0f" },
  { value: "pink", label: "Pink", swatch: "#ec4899" },
  { value: "blue", label: "Blue", swatch: "#3b82f6" },
  { value: "beige", label: "Beige", swatch: "#c2612e" },
  { value: "black-luxury", label: "Luxury", swatch: "#d4af37" },
];

export default function Me() {
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("kat_name") ?? "");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [loggedIn, setLoggedIn] = useState(true);
  const [address, setAddress] = useState(() => localStorage.getItem("kat_address") ?? "");
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(address);
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "coupons" | "returns">("orders");

  const saveName = () => {
    setDisplayName(nameInput);
    localStorage.setItem("kat_name", nameInput);
    setEditingName(false);
  };

  const saveAddress = () => {
    setAddress(addressInput);
    localStorage.setItem("kat_address", addressInput);
    setEditingAddress(false);
  };

  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : "KAT";

  const menuItems = [
    { icon: <Package className="w-4 h-4" />, label: "My Orders", tab: "orders" as const },
    { icon: <MapPin className="w-4 h-4" />, label: "Delivery Addresses", tab: "addresses" as const },
    { icon: <Tag className="w-4 h-4" />, label: "Coupons & Vouchers", tab: "coupons" as const },
    { icon: <RotateCcw className="w-4 h-4" />, label: "Returns & Refunds", tab: "returns" as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-base font-black">My Account</h1>
          </div>
          <ThemeSwitcher />
          <Link href="/seller">
            <Button variant="ghost" size="sm" className="rounded-full text-xs gap-1.5">
              <Store className="w-3.5 h-3.5" /> Sell on KAT
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-24 space-y-4">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-card-border rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex gap-2">
                  <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    placeholder="Your name..." className="rounded-xl text-sm h-8" autoFocus />
                  <Button size="sm" onClick={saveName} className="rounded-xl px-3 h-8">Save</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base truncate">{displayName || "Set your name"}</p>
                  <button onClick={() => { setNameInput(displayName); setEditingName(true); }}
                    className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0">
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">KAT Member</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: "Orders", value: MOCK_ORDERS.length },
              { label: "Boards", value: 3 },
              { label: "Reviews", value: 7 },
            ].map((s) => (
              <div key={s.label} className="bg-muted rounded-xl p-2.5 text-center">
                <p className="text-lg font-black text-primary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-muted p-1 rounded-2xl">
          {menuItems.map(({ icon, label, tab }) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-semibold transition-all ${activeTab === tab ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {icon}
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* Orders */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {MOCK_ORDERS.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-start">
                <img src={order.image} alt={order.items} className="w-14 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">{order.id}</p>
                      <p className="text-sm font-semibold leading-tight line-clamp-2 mt-0.5">{order.items}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[order.status]}`}>
                      {STATUS_ICONS[order.status]} {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                    <p className="text-sm font-black text-primary">{formatNaira(order.amount)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Addresses */}
        {activeTab === "addresses" && (
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
            <p className="font-bold text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Delivery Address</p>
            {editingAddress ? (
              <div className="space-y-2">
                <textarea value={addressInput} onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Enter your full delivery address..."
                  className="w-full text-sm bg-muted rounded-xl p-3 resize-none h-24 outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveAddress} className="rounded-full">Save Address</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingAddress(false)} className="rounded-full">Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                {address ? (
                  <div className="bg-muted rounded-xl p-3 text-sm">{address}</div>
                ) : (
                  <p className="text-sm text-muted-foreground">No address saved yet</p>
                )}
                <Button size="sm" variant="outline" className="mt-3 rounded-full" onClick={() => { setAddressInput(address); setEditingAddress(true); }}>
                  {address ? "Edit Address" : "Add Address"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Coupons */}
        {activeTab === "coupons" && (
          <div className="space-y-3">
            {[
              { code: "KAT10", discount: "10% OFF", desc: "Valid on all orders", expiry: "Jun 30, 2025", color: "from-primary/20 to-primary/5 border-primary/30" },
              { code: "SLAY20", discount: "20% OFF", desc: "Fashion category only", expiry: "May 31, 2025", color: "from-purple-500/20 to-purple-400/5 border-purple-300/40" },
              { code: "FIRST15", discount: "15% OFF", desc: "First order discount", expiry: "Dec 31, 2025", color: "from-emerald-500/20 to-emerald-400/5 border-emerald-300/40" },
            ].map((c) => (
              <div key={c.code} className={`bg-gradient-to-r ${c.color} border rounded-2xl p-4 relative overflow-hidden`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-black text-primary">{c.discount}</p>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Expires {c.expiry}</p>
                  </div>
                  <div className="text-right">
                    <code className="text-sm font-black bg-background/80 px-3 py-1.5 rounded-lg border border-border">{c.code}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Returns */}
        {activeTab === "returns" && (
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">Return & Refund Policy</p>
                <p className="text-xs text-muted-foreground">14-day return window</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Items must be unworn and in original condition</p>
              <p>✓ Include original packaging and tags</p>
              <p>✓ Refunds processed within 5–7 business days</p>
              <p>✓ Return shipping is free for defective items</p>
              <p>✗ Thrift items are non-refundable once payment is complete</p>
              <p>✗ Beauty and health items cannot be returned once opened</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full w-full">Start a Return Request</Button>
          </div>
        )}

        {/* Theme picker */}
        <div className="bg-card border border-card-border rounded-2xl p-4">
          <p className="font-bold text-sm mb-3">App Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((t) => (
              <button key={t.value} onClick={() => setTheme(t.value)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-sm font-medium ${theme === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <span className="w-4 h-4 rounded-full border border-white/50 shadow-sm shrink-0" style={{ background: t.swatch }} />
                <span className="text-xs">{t.label}</span>
                {theme === t.value && <Check className="w-3 h-3 text-primary ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Help & Support */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          {[
            { icon: <HelpCircle className="w-4 h-4" />, label: "Help & Support" },
            { icon: <Shield className="w-4 h-4" />, label: "Privacy Policy" },
            { icon: <Star className="w-4 h-4" />, label: "Rate the KAT App" },
          ].map(({ icon, label }, i, arr) => (
            <React.Fragment key={label}>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors text-sm">
                <span className="text-muted-foreground">{icon}</span>
                <span className="flex-1 text-left font-medium">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              {i < arr.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </div>

        {/* Logout */}
        <Button variant="outline" className="w-full rounded-2xl h-12 border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold gap-2"
          onClick={() => setLoggedIn(false)}>
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </main>
    </div>
  );
}

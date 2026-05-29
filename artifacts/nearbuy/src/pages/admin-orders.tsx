import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft, ShieldCheck, Package, MapPin, Phone,
  Printer, Search, ChevronDown, ChevronUp, Clock,
  Truck, CheckCircle, XCircle, User, Mail, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OrderStatus = "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";

interface OrderItem {
  title: string;
  qty: number;
  price: number;
  seller: string;
}

interface Order {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  address: string;
  city: string;
  state: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  date: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  processing:       { label: "Processing",       color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",   icon: <Clock className="w-3 h-3" /> },
  shipped:          { label: "Shipped",           color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",       icon: <Truck className="w-3 h-3" /> },
  out_for_delivery: { label: "Out for Delivery",  color: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400", icon: <Package className="w-3 h-3" /> },
  delivered:        { label: "Delivered",         color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled:        { label: "Cancelled",         color: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",           icon: <XCircle className="w-3 h-3" /> },
};

const STATUS_FLOW: OrderStatus[] = ["processing", "shipped", "out_for_delivery", "delivered"];

const MOCK_ORDERS: Order[] = [
  {
    id: "KAT-882201",
    buyerName: "Chidinma Okonkwo", buyerEmail: "chidinma@gmail.com", buyerPhone: "08012345678",
    address: "14 Admiralty Road, Lekki Phase 1", city: "Lagos", state: "Lagos",
    items: [{ title: "Ankara Co-ord Blazer & Wide-Leg Set", qty: 1, price: 18500, seller: "Adire House" }],
    subtotal: 18500, deliveryFee: 2000, total: 20500, status: "shipped", date: "May 22, 2025",
  },
  {
    id: "KAT-990102",
    buyerName: "Blessing Nwosu", buyerEmail: "blessing@gmail.com", buyerPhone: "07098765432",
    address: "23 Awolowo Road, Ikoyi", city: "Lagos", state: "Lagos",
    items: [
      { title: "Baddie Bodycon Slit Dress", qty: 1, price: 12000, seller: "GlowUp Studio" },
      { title: "Gold Chain Layered Set", qty: 2, price: 4500, seller: "Lagos Jewels" },
    ],
    subtotal: 21000, deliveryFee: 0, total: 21000, status: "processing", date: "May 25, 2025",
  },
  {
    id: "KAT-771203",
    buyerName: "Funmi Bello", buyerEmail: "funmi@yahoo.com", buyerPhone: "09055512345",
    address: "7 Trans Amadi Road", city: "Port Harcourt", state: "Rivers",
    items: [{ title: "Lace Front Wig – Straight 18\"", qty: 1, price: 48000, seller: "Adire House" }],
    subtotal: 48000, deliveryFee: 3500, total: 51500, status: "delivered", date: "May 10, 2025",
  },
  {
    id: "KAT-443304",
    buyerName: "Ngozi Okafor", buyerEmail: "ngozi@gmail.com", buyerPhone: "08123456789",
    address: "45 Gwarinpa Estate", city: "Abuja", state: "FCT",
    items: [
      { title: "Thrift: Y2K Butterfly Print Mini Skirt", qty: 1, price: 8500, seller: "Lagos Thrift House" },
      { title: "Ankara Tote Bag", qty: 1, price: 6500, seller: "Adire House" },
    ],
    subtotal: 15000, deliveryFee: 2500, total: 17500, status: "out_for_delivery", date: "May 26, 2025",
  },
  {
    id: "KAT-551505",
    buyerName: "Adaeze Ihejirika", buyerEmail: "adaeze@gmail.com", buyerPhone: "08087654321",
    address: "12 Bisola Durosinmi-Etti Street, Lekki", city: "Lagos", state: "Lagos",
    items: [{ title: "Plus Size Wrap Midi Dress", qty: 1, price: 21000, seller: "CurveByNaija" }],
    subtotal: 21000, deliveryFee: 2000, total: 23000, status: "cancelled", date: "May 19, 2025",
  },
  {
    id: "KAT-664406",
    buyerName: "Temi Adewale", buyerEmail: "temi@gmail.com", buyerPhone: "08034567890",
    address: "9 Olosa Street, Victoria Island", city: "Lagos", state: "Lagos",
    items: [
      { title: "Linen Wide-Leg Trousers", qty: 1, price: 16000, seller: "Monochrome Lagos" },
      { title: "Structured Minimalist Tote", qty: 1, price: 22000, seller: "Monochrome Lagos" },
    ],
    subtotal: 38000, deliveryFee: 0, total: 38000, status: "processing", date: "May 28, 2025",
  },
];

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

function handlePrint(order: Order) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>Delivery Sheet – ${order.id}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; color: #111; }
      h1 { font-size: 22px; font-weight: bold; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 16px; }
      .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; }
      .section { margin-bottom: 16px; }
      .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 3px; }
      .value { font-size: 15px; font-weight: 600; }
      .sub { font-size: 13px; color: #444; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { text-align: left; font-size: 11px; text-transform: uppercase; color: #666; padding: 6px 0; border-bottom: 1px solid #ddd; }
      td { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
      .total { font-weight: bold; font-size: 16px; border-top: 2px solid #111; }
      .footer { margin-top: 24px; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 12px; }
    </style></head><body>
    <h1>KAT Delivery Sheet</h1>
    <div class="row">
      <div class="section"><div class="label">Order ID</div><div class="value">${order.id}</div></div>
      <div class="section"><div class="label">Order Date</div><div class="value">${order.date}</div></div>
    </div>
    <div class="section">
      <div class="label">Buyer</div>
      <div class="value">${order.buyerName}</div>
      <div class="sub">${order.buyerPhone} &nbsp;·&nbsp; ${order.buyerEmail}</div>
    </div>
    <div class="section">
      <div class="label">Delivery Address</div>
      <div class="value">${order.address}</div>
      <div class="sub">${order.city}, ${order.state}, Nigeria</div>
    </div>
    <div class="section">
      <div class="label">Items</div>
      <table>
        <tr><th>Item</th><th>Seller</th><th>Qty</th><th>Price</th></tr>
        ${order.items.map(i => `<tr><td>${i.title}</td><td>${i.seller}</td><td>${i.qty}</td><td>${formatNaira(i.price * i.qty)}</td></tr>`).join("")}
        <tr><td colspan="3" style="text-align:right;font-size:12px;color:#666;padding-top:8px;">Delivery fee</td><td>${order.deliveryFee === 0 ? "FREE" : formatNaira(order.deliveryFee)}</td></tr>
        <tr class="total"><td colspan="3" style="text-align:right;padding-top:8px;">TOTAL</td><td>${formatNaira(order.total)}</td></tr>
      </table>
    </div>
    <div class="footer">KAT Marketplace · Nigeria's favourite fashion marketplace · Printed ${new Date().toLocaleDateString("en-NG")}</div>
    <script>window.onload = () => window.print();</script>
    </body></html>
  `);
  win.document.close();
}

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const isAdmin = user?.isAdmin;

  const updateStatus = (id: string, status: OrderStatus) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

  const filtered = orders.filter(o => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchSearch = !search || [o.id, o.buyerName, o.buyerEmail, o.city, o.state]
      .some(f => f.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const counts = {
    all: orders.length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    out_for_delivery: orders.filter(o => o.status === "out_for_delivery").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

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
        <Link href="/"><Button variant="outline" className="rounded-full">Back to Home</Button></Link>
      </div>
    );
  }

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
              <Truck className="w-4 h-4 text-primary" />
              Order Management
            </h1>
            <p className="text-[11px] text-muted-foreground">Admin Panel · KAT Delivery Control</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 pb-24 space-y-4">

        {/* Status filter strip */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(["all", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"] as const).map((s) => (
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
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID, buyer name, city..."
            className="rounded-xl pl-9 h-9 text-sm"
          />
        </div>

        {/* Orders list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No orders found</p>
            </div>
          )}

          {filtered.map((order, i) => {
            const cfg = STATUS_CONFIG[order.status];
            const isExpanded = expanded === order.id;
            const currentIdx = STATUS_FLOW.indexOf(order.status);
            const nextStatus: OrderStatus | null = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
              ? STATUS_FLOW[currentIdx + 1]
              : null;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-card-border rounded-2xl overflow-hidden"
              >
                {/* Header row — click to expand */}
                <div
                  className="p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-mono text-[11px] text-muted-foreground">{order.id}</p>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <p className="font-bold text-sm">{order.buyerName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.city}, {order.state} · {order.date} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-primary">{formatNaira(order.total)}</span>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border overflow-hidden"
                    >
                      <div className="p-4 space-y-4">

                        {/* Buyer info grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { icon: <User className="w-3 h-3" />, label: "Buyer", value: order.buyerName },
                            { icon: <Phone className="w-3 h-3" />, label: "Phone", value: order.buyerPhone },
                            { icon: <Mail className="w-3 h-3" />, label: "Email", value: order.buyerEmail },
                          ].map(({ icon, label, value }) => (
                            <div key={label} className="bg-muted/50 rounded-xl p-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                                {icon} {label}
                              </p>
                              <p className="text-sm font-bold truncate">{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Address */}
                        <div className="bg-muted/50 rounded-xl p-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Delivery Address (Nigeria only)
                          </p>
                          <p className="text-sm font-bold">{order.address}</p>
                          <p className="text-xs text-muted-foreground">{order.city}, {order.state} State, Nigeria</p>
                        </div>

                        {/* Items */}
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" /> Items Ordered
                          </p>
                          <div className="rounded-xl border border-border overflow-hidden">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/30"
                              >
                                <div>
                                  <p className="text-sm font-medium">{item.title}</p>
                                  <p className="text-xs text-muted-foreground">Seller: {item.seller} · Qty: {item.qty}</p>
                                </div>
                                <span className="font-bold text-sm shrink-0">{formatNaira(item.price * item.qty)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center px-3 py-2 bg-muted/30">
                              <span className="text-xs text-muted-foreground">Delivery fee</span>
                              <span className="text-sm font-semibold">
                                {order.deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatNaira(order.deliveryFee)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center px-3 py-2.5 border-t-2 border-border bg-muted/50">
                              <span className="font-bold">Total</span>
                              <span className="font-black text-primary text-base">{formatNaira(order.total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full gap-1.5 text-xs"
                            onClick={() => handlePrint(order)}
                          >
                            <Printer className="w-3 h-3" /> Print Delivery Sheet
                          </Button>

                          {order.status === "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full text-xs"
                              onClick={() => updateStatus(order.id, "processing")}
                            >
                              Reopen Order
                            </Button>
                          )}

                          {order.status !== "cancelled" && order.status !== "delivered" && (
                            <>
                              {nextStatus && (
                                <Button
                                  size="sm"
                                  className="rounded-full gap-1 text-xs font-semibold"
                                  onClick={() => updateStatus(order.id, nextStatus)}
                                >
                                  Mark as {STATUS_CONFIG[nextStatus].label}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                                onClick={() => updateStatus(order.id, "cancelled")}
                              >
                                Cancel Order
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-muted-foreground pt-2">
          Showing {filtered.length} of {orders.length} orders ·{" "}
          <span className="text-amber-600 font-semibold">{counts.processing} processing</span>
          {counts.shipped > 0 && <span className="text-blue-600"> · {counts.shipped} shipped</span>}
        </p>
      </main>
    </div>
  );
}

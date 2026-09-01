import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, ShoppingBag, MapPin, Package, Home, MessageCircle, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

export default function OrderConfirmation() {
  const [, navigate] = useLocation();
  const [order, setOrder] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("kat_order_confirmed");
    if (stored) {
      try { setOrder(JSON.parse(stored)); }
      catch { setNotFound(true); }
    } else {
      setNotFound(true);
    }
  }, []);

  const copyOrderNumber = () => {
    if (!order?.paymentRef) return;
    navigator.clipboard.writeText(order.paymentRef).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-bold text-lg">We couldn't load this order confirmation</p>
          <p className="text-sm text-muted-foreground mt-2">
            This can happen after a refresh. If your payment went through, you'll find the order in your order history.
          </p>
          <div className="mt-6 space-y-2">
            <Link href="/me">
              <Button className="w-full rounded-full font-bold">View my orders</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full rounded-full font-bold">Continue shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const estimatedDelivery = () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="max-w-lg mx-auto px-4 py-8 space-y-5">

        {/* Success animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="text-center py-8"
        >
          <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black">Order Placed! 🎉</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Thank you {order.fullName.split(" ")[0]}! Your order has been received and is being processed.
          </p>

          {order.paymentRef && (
            <button
              onClick={copyOrderNumber}
              className="mt-4 inline-flex items-center gap-2 bg-muted hover:bg-muted/70 transition-colors rounded-full px-4 py-2 mx-auto"
              aria-label="Copy order number"
            >
              <span className="text-xs text-muted-foreground">Order #</span>
              <span className="text-xs font-bold font-mono">{order.paymentRef}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          )}
        </motion.div>

        {/* Order details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-card-border rounded-2xl p-4 space-y-3"
        >
          <p className="text-sm font-bold">Order Summary</p>
          {order.items.map((item: any, i: number) => (
            <div key={i} className="flex gap-3 items-center">
              <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded-xl object-contain shrink-0 bg-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold line-clamp-1">{item.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {[item.selectedColor, item.selectedSize].filter(Boolean).join(" / ")} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-xs font-bold text-primary shrink-0">{formatNaira(item.price * item.quantity)}</p>
            </div>
          ))}
          <div className="border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatNaira(order.total - order.delivery)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className={order.delivery === 0 ? "text-emerald-600 font-semibold" : ""}>
                {order.delivery === 0 ? "Free 🎉" : formatNaira(order.delivery)}
              </span>
            </div>
            <div className="flex justify-between font-black text-base">
              <span>Total Paid</span>
              <span className="text-primary">{formatNaira(order.total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Delivery info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-card-border rounded-2xl p-4 space-y-3"
        >
          <p className="text-sm font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Delivery Details
          </p>
          <div className="text-sm space-y-1">
            <p className="font-semibold">{order.fullName}</p>
            <p className="text-muted-foreground">{order.phone}</p>
            <p className="text-muted-foreground">{order.address}</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
            <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Estimated delivery: {estimatedDelivery()}
            </p>
          </div>
        </motion.div>

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-card-border rounded-2xl p-4 space-y-3"
        >
          <p className="text-sm font-bold">What happens next?</p>
          <div className="space-y-3">
            {[
  { step: "1", label: "Order placed", desc: "We've received your order", done: true },
  { step: "2", label: "Order confirmed", desc: "Your seller has confirmed your order", done: false },
  { step: "3", label: "Order processed", desc: "Your order is being prepared", done: false },
  { step: "4", label: "Out for delivery", desc: "Your order is on its way", done: false },
  { step: "5", label: "Delivered", desc: "Enjoy your new piece! 🎉", done: false },
].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${s.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  {s.done ? "✓" : s.step}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${s.done ? "text-emerald-600" : ""}`}>{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-muted rounded-2xl p-4 flex items-center gap-3"
        >
          <MessageCircle className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Need help with your order?</p>
            <p className="text-xs text-muted-foreground">
              Contact us on WhatsApp{order.paymentRef ? ` with order #${order.paymentRef}` : ""}</p>
          </div>
          <a href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="rounded-full text-xs shrink-0">Chat</Button>
          </a>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-2"
        >
          <Button
  className="w-full rounded-full font-bold h-12 gap-2"
  onClick={() => navigate("/")}
>
  <Home className="w-4 h-4" /> Continue Shopping
</Button>
          <Button
  variant="outline"
  className="w-full rounded-full font-bold h-12 gap-2"
  onClick={() => navigate("/me")}
>
  <ShoppingBag className="w-4 h-4" /> View My Orders
</Button>
        </motion.div>
      </main>
    </div>
  );
  }

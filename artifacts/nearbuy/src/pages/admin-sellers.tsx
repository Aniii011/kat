import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft, ShieldCheck, Check, X, Store,
  Clock, Mail, Calendar, Search, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type SellerStatus = "pending" | "approved" | "rejected";

interface SellerApp {
  id: string;
  storeName: string;
  email: string;
  ownerName: string;
  requestDate: string;
  status: SellerStatus;
  category: string;
}

const MOCK_SELLERS: SellerApp[] = [
  { id: "s1", storeName: "Adaeze Couture", email: "adaeze@example.com", ownerName: "Adaeze Okonkwo", requestDate: "May 20, 2025", status: "pending", category: "Women's Fashion" },
  { id: "s2", storeName: "The Baddie Boutique", email: "baddie@example.com", ownerName: "Chidinma Eze", requestDate: "May 18, 2025", status: "pending", category: "Streetwear" },
  { id: "s3", storeName: "Lagos Thrift House", email: "thrift@example.com", ownerName: "Funmi Bello", requestDate: "May 15, 2025", status: "approved", category: "Thrift & Vintage" },
  { id: "s4", storeName: "GlowUp Beauty Bar", email: "glow@example.com", ownerName: "Blessing Nwosu", requestDate: "May 12, 2025", status: "approved", category: "Beauty & Health" },
  { id: "s5", storeName: "Naija Sneaker Plug", email: "sneakers@example.com", ownerName: "Tunde Adeyemi", requestDate: "May 10, 2025", status: "rejected", category: "Shoes" },
  { id: "s6", storeName: "Ankara Queen", email: "ankara@example.com", ownerName: "Ngozi Obi", requestDate: "May 8, 2025", status: "approved", category: "Women's Fashion" },
];

const STATUS_CONFIG: Record<SellerStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
};

export default function AdminSellers() {
  const { user } = useAuth();
  const [sellers, setSellers] = useState<SellerApp[]>(MOCK_SELLERS);
  const [filter, setFilter] = useState<SellerStatus | "all">("all");
  const [search, setSearch] = useState("");

  const isAdmin = user?.isAdmin || user?.email === "admin@kat.com";

  const approve = (id: string) => setSellers(prev => prev.map(s => s.id === id ? { ...s, status: "approved" } : s));
  const reject = (id: string) => setSellers(prev => prev.map(s => s.id === id ? { ...s, status: "rejected" } : s));

  const filtered = sellers.filter(s => {
    const matchStatus = filter === "all" || s.status === filter;
    const matchSearch = !search || [s.storeName, s.email, s.ownerName].some(f =>
      f.toLowerCase().includes(search.toLowerCase())
    );
    return matchStatus && matchSearch;
  });

  const counts = {
    all: sellers.length,
    pending: sellers.filter(s => s.status === "pending").length,
    approved: sellers.filter(s => s.status === "approved").length,
    rejected: sellers.filter(s => s.status === "rejected").length,
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-black mb-2">Admin Access Only</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          This area is restricted to KAT administrators. Sign in with an admin account to continue.
        </p>
        <Link href="/">
          <Button variant="outline" className="rounded-full">Back to Home</Button>
        </Link>
      </div>
    );
  }

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
              <ShieldCheck className="w-4 h-4 text-primary" />
              Seller Management
            </h1>
            <p className="text-[11px] text-muted-foreground">Admin Panel · KAT</p>
          </div>
          <Link href="/admin/orders">
            <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs font-semibold shrink-0">
              <Truck className="w-3.5 h-3.5" /> Orders
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 pb-24 space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setFilter(s)}
              className={`rounded-2xl p-3 text-center border transition-all ${
                filter === s ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <p className="text-xl font-black">{counts[s]}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{s}</p>
            </motion.button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sellers..."
              className="rounded-xl pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No sellers found</p>
            </div>
          )}
          {filtered.map((seller, i) => (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-card-border rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{seller.storeName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[seller.status].className}`}>
                      {STATUS_CONFIG[seller.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{seller.ownerName}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Mail className="w-3 h-3" /> {seller.email}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="w-3 h-3" /> {seller.requestDate}
                    </span>
                    <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {seller.category}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {seller.status === "pending" && (
                  <div className="flex gap-1.5 shrink-0 mt-0.5">
                    <Button
                      size="sm"
                      onClick={() => approve(seller.id)}
                      className="rounded-full h-8 px-3 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="w-3 h-3" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reject(seller.id)}
                      className="rounded-full h-8 px-3 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                )}
                {seller.status === "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reject(seller.id)}
                    className="rounded-full h-8 px-3 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0 mt-0.5"
                  >
                    <X className="w-3 h-3" /> Revoke
                  </Button>
                )}
                {seller.status === "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => approve(seller.id)}
                    className="rounded-full h-8 px-3 text-xs gap-1 shrink-0 mt-0.5"
                  >
                    <Check className="w-3 h-3" /> Re-approve
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-[11px] text-muted-foreground pt-2">
          Showing {filtered.length} of {sellers.length} sellers ·{" "}
          <span className="text-amber-600 font-semibold">{counts.pending} pending review</span>
        </p>
      </main>
    </div>
  );
}

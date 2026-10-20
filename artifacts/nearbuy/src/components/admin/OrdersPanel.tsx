import { useMemo, useState } from "react";
import { AlertTriangle, Download, Gift, Package, RefreshCw, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AdminOrderDetail from "@/pages/admin-order-detail";
import { groupOrdersByPurchase, type PurchaseGroup } from "@/lib/order-groups";

// ─────────────────────────────────────────────────────────────────────────────
// Admin Orders — one row per PURCHASE (one payment), like the reference design:
// queue tabs with counts, filters, a table, bulk export, and a detail panel that
// opens beside the table (full screen on phones).
// ─────────────────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

function ageLabel(dateStr: string): string {
  const hrs = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${Math.floor(hrs)}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Few colours on purpose: amber = needs you, blue = in motion, green = done, red = cancelled.
const STATUS_CHIP: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  preparing: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  ready_for_pickup: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
  out_for_delivery: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

const QUEUES: { key: string; label: string; statuses: string[] }[] = [
  { key: "all", label: "All", statuses: [] },
  { key: "q:action", label: "Needs action", statuses: ["pending"] },
  { key: "q:progress", label: "In progress", statuses: ["accepted", "preparing", "ready_for_pickup"] },
  { key: "q:delivery", label: "Delivery", statuses: ["out_for_delivery", "delivered"] },
  { key: "q:done", label: "Completed", statuses: ["completed"] },
  { key: "q:cancelled", label: "Cancelled", statuses: ["cancelled"] },
  { key: "q:stock", label: "Stock issues", statuses: [] }, // matched by hasStockIssue(), not by status
];

const hasStockIssue = (g: PurchaseGroup) => g.lines.some((l: any) => !!l.stock_issue);

function matchesFilter(status: string, filter: string, group?: PurchaseGroup): boolean {
  if (filter === "all") return true;
  if (filter === "q:stock") return !!group && hasStockIssue(group);
  const q = QUEUES.find((x) => x.key === filter);
  if (q) return q.statuses.includes(status);
  return status === filter; // an exact status picked in the Status dropdown
}

const DATE_RANGES: { key: string; label: string; days: number | null }[] = [
  { key: "all", label: "All time", days: null },
  { key: "1", label: "Today", days: 1 },
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
];

const PAGE = 50;

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

interface Props {
  orders: any[];
  products: any[];
  users: any[];
  loading: boolean;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onRefresh: () => void;
  cancellationRate: number;
  fulfillmentRate: number;
}

export default function OrdersPanel({
  orders, products, users, loading, statusFilter, onStatusFilterChange, onRefresh, cancellationRate, fulfillmentRate,
}: Props) {
  const [search, setSearch] = useState("");
  const [dateKey, setDateKey] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "highest">("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null); // order open in the panel
  const [checked, setChecked] = useState<Set<string>>(new Set()); // rows ticked for bulk actions
  const [visible, setVisible] = useState(PAGE);

  const productsById = useMemo(() => {
    const m: Record<string, any> = {};
    products.forEach((p) => { m[p.id] = p; });
    return m;
  }, [products]);
  const usersById = useMemo(() => {
    const m: Record<string, any> = {};
    users.forEach((u) => { m[u.id] = u; });
    return m;
  }, [users]);

  const allGroups = useMemo(() => groupOrdersByPurchase(orders), [orders]);

  // Per-customer history, so each row can say "3rd order" and the CSV can feed loyalty gifts.
  const customerStats = useMemo(() => {
    const m: Record<string, { orders: number; spend: number; first: string }> = {};
    allGroups.forEach((g) => {
      const buyer = (g.lines[0] as any).buyer_id;
      if (!buyer) return;
      const s = (m[buyer] ||= { orders: 0, spend: 0, first: g.createdAt });
      if (g.headlineStatus !== "cancelled") { s.orders += 1; s.spend += g.total; }
      if (g.createdAt < s.first) s.first = g.createdAt;
    });
    return m;
  }, [allGroups]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUEUES.forEach((q) => { c[q.key] = allGroups.filter((g) => matchesFilter(g.headlineStatus, q.key, g)).length; });
    return c;
  }, [allGroups]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const range = DATE_RANGES.find((d) => d.key === dateKey)?.days ?? null;
    const cutoff = range ? Date.now() - range * 24 * 60 * 60 * 1000 : 0;
    let list = allGroups.filter((g) => {
      if (!matchesFilter(g.headlineStatus, statusFilter, g)) return false;
      if (range && new Date(g.createdAt).getTime() < cutoff) return false;
      if (!q) return true;
      return g.lines.some((o: any) => {
        const p = productsById[o.product_id];
        const s = usersById[o.seller_id];
        return [o.id, o.payment_ref, o.buyer_name, o.buyer_phone, o.buyer_address, o.delivery_area, o.delivery_state, o.product_title, p?.title, s?.full_name, s?.store_name]
          .some((f) => f && String(f).toLowerCase().includes(q));
      });
    });
    list = [...list].sort((a, b) => {
      if (sort === "highest") return b.total - a.total;
      const d = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort === "oldest" ? d : -d;
    });
    return list;
  }, [allGroups, statusFilter, dateKey, search, sort, productsById, usersById]);

  const shown = rows.slice(0, visible);
  const firstId = (g: PurchaseGroup) => g.lines[0].id;
  const allChecked = shown.length > 0 && shown.every((g) => checked.has(g.groupKey));

  const toggleAll = () => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (allChecked) shown.forEach((g) => next.delete(g.groupKey));
      else shown.forEach((g) => next.add(g.groupKey));
      return next;
    });
  };
  const toggleOne = (key: string) =>
    setChecked((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const exportCsv = () => {
    const picked = rows.filter((g) => checked.has(g.groupKey));
    const header = ["Payment ref", "Placed", "Status", "Customer", "Phone", "Address", "Area", "State", "Items", "Sellers", "Subtotal", "Delivery fee", "Discount", "Total",
      "Customer orders", "Customer since"];
    const lines = picked.map((g) => {
      const f: any = g.lines[0];
      const cs = customerStats[f.buyer_id];
      const items = g.lines.map((l: any) => `${l.product_title || productsById[l.product_id]?.title || "Item"} x${l.quantity}`).join("; ");
      return [g.paymentRef || f.id, new Date(g.createdAt).toISOString(), STATUS_LABEL[g.headlineStatus] || g.headlineStatus,
        f.buyer_name, f.buyer_phone, f.buyer_address, f.delivery_area, f.delivery_state, items, g.sellerCount,
        g.subtotal, g.deliveryFee, g.discount, g.total, cs?.orders ?? "", cs ? cs.first.slice(0, 10) : ""].map(csvCell).join(",");
    });
    const blob = new Blob(["\ufeff" + [header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kat-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Thumbs = ({ g, size = "w-9 h-9" }: { g: PurchaseGroup; size?: string }) => (
    <div className="flex -space-x-3 shrink-0">
      {g.lines.slice(0, 3).map((l: any) => {
        const src = productsById[l.product_id]?.image_url || l.product_image;
        return src ? (
          <img key={l.id} src={src} alt="" className={`${size} rounded-lg object-cover border-2 border-card`} />
        ) : (
          <div key={l.id} className={`${size} rounded-lg bg-muted border-2 border-card flex items-center justify-center`}>
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
        );
      })}
    </div>
  );

  const Chip = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${STATUS_CHIP[status] || "bg-muted text-foreground"}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );

  const isGift = (g: PurchaseGroup) => g.lines.some((l: any) => !!l.variant?.gift);
  const isAging = (g: PurchaseGroup) =>
    ["pending", "accepted", "preparing"].includes(g.headlineStatus) && Date.now() - new Date(g.createdAt).getTime() > 2 * 24 * 60 * 60 * 1000;
  const customerLabel = (g: PurchaseGroup) => {
    const cs = customerStats[(g.lines[0] as any).buyer_id];
    return cs && cs.orders > 1 ? `${cs.orders} orders` : "First order";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Orders <span className="text-muted-foreground font-semibold">({allGroups.length})</span></h2>
          <p className="text-xs text-muted-foreground">
            Cancellation rate {cancellationRate.toFixed(1)}% · Fulfillment rate {fulfillmentRate.toFixed(0)}%
          </p>
        </div>
        <button onClick={onRefresh} aria-label="Refresh orders" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Queue tabs with counts */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {QUEUES.filter((q) => q.key !== "q:stock" || (counts[q.key] ?? 0) > 0 || statusFilter === q.key).map((q) => {
          const active = statusFilter === q.key;
          return (
            <button
              key={q.key}
              onClick={() => { onStatusFilterChange(q.key); setVisible(PAGE); }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"}`}
            >
              {q.label} <span className={active ? "opacity-80" : "opacity-60"}>{counts[q.key] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setVisible(PAGE); }} placeholder="Search order ID, customer, phone, product, seller, area…" className="rounded-xl pl-9 h-9 text-sm" />
        </div>
        <select
          value={QUEUES.some((q) => q.key === statusFilter) ? "" : statusFilter}
          onChange={(e) => { onStatusFilterChange(e.target.value || "all"); setVisible(PAGE); }}
          className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium"
          aria-label="Status"
        >
          <option value="">Status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={dateKey} onChange={(e) => { setDateKey(e.target.value); setVisible(PAGE); }} className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium" aria-label="Order date">
          {DATE_RANGES.map((d) => <option key={d.key} value={d.key}>{d.key === "all" ? "Order date" : d.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium" aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest total</option>
        </select>
        {(search || dateKey !== "all" || statusFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setDateKey("all"); onStatusFilterChange("all"); }}
            className="h-9 px-3 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Clear
          </button>
        )}
      </div>

      <div className="lg:flex lg:gap-4 lg:items-start">
        {/* ───────── List ───────── */}
        <div className="flex-1 min-w-0">
          {loading && orders.length === 0 && (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2"><div className="h-2.5 w-24 rounded bg-muted" /><div className="h-3 w-32 rounded bg-muted" /></div>
                  <div className="h-4 w-14 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {/* Desktop / tablet: table */}
          {shown.length > 0 && (
            <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/40">
                    <th className="w-10 pl-4 py-2.5"><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" /></th>
                    <th className="py-2.5 pr-3">Order</th>
                    <th className="py-2.5 pr-3">Customer</th>
                    <th className="py-2.5 pr-3">Items</th>
                    <th className="py-2.5 pr-3 hidden xl:table-cell">Area</th>
                    <th className="py-2.5 pr-3">Status</th>
                    <th className="py-2.5 pr-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((g) => {
                    const f: any = g.lines[0];
                    const open = selectedId === firstId(g);
                    return (
                      <tr
                        key={g.groupKey}
                        onClick={() => setSelectedId(firstId(g))}
                        className={`border-b border-border last:border-0 cursor-pointer transition-colors ${open ? "bg-primary/5" : "hover:bg-muted/40"}`}
                      >
                        <td className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={checked.has(g.groupKey)} onChange={() => toggleOne(g.groupKey)} aria-label="Select order" />
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-mono text-xs font-semibold">{g.paymentRef ? g.paymentRef.replace(/^KAT-/, "#") : `#${f.id.slice(0, 8)}`}</p>
                          <p className="text-[11px] text-muted-foreground">{ageLabel(g.createdAt)}{isAging(g) ? " · aging" : ""}</p>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold shrink-0">
                              {(f.buyer_name || "?").trim().charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold truncate max-w-[150px] flex items-center gap-1">
                                {f.buyer_name || "Unknown"}
                                {isGift(g) && <Gift className="w-3 h-3 text-primary shrink-0" aria-label="Gift order" />}
                                {hasStockIssue(g) && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" aria-label="Stock problem" />}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{customerLabel(g)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <Thumbs g={g} />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {g.lines.length} item{g.lines.length > 1 ? "s" : ""}{g.sellerCount > 1 ? ` · ${g.sellerCount} sellers` : ""}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 hidden xl:table-cell text-xs text-muted-foreground">{[f.delivery_area, f.delivery_state].filter(Boolean).join(", ") || "—"}</td>
                        <td className="py-3 pr-3"><Chip status={g.headlineStatus} /></td>
                        <td className="py-3 pr-4 text-right font-bold whitespace-nowrap">{formatNaira(g.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Phones: cards */}
          {shown.length > 0 && (
            <div className="md:hidden space-y-2">
              {shown.map((g) => {
                const f: any = g.lines[0];
                return (
                  <button
                    key={g.groupKey}
                    onClick={() => setSelectedId(firstId(g))}
                    className={`w-full text-left bg-card border border-border rounded-2xl p-3 flex items-center gap-3 ${isAging(g) ? "border-l-4 border-l-amber-400" : ""}`}
                  >
                    <Thumbs g={g} size="w-10 h-10" />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[11px] text-muted-foreground truncate">{g.paymentRef || `#${f.id.slice(0, 8)}`}</p>
                      <p className="font-bold text-sm truncate flex items-center gap-1">
                        {f.buyer_name || "Unknown buyer"}
                        {isGift(g) && <Gift className="w-3 h-3 text-primary shrink-0" />}
                        {hasStockIssue(g) && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" aria-label="Stock problem" />}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {g.lines.length} item{g.lines.length > 1 ? "s" : ""}{g.sellerCount > 1 ? ` · ${g.sellerCount} sellers` : ""} · {ageLabel(g.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-black text-sm">{formatNaira(g.total)}</p>
                      <Chip status={g.headlineStatus} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-sm">No orders found</p>
              {(search || dateKey !== "all" || statusFilter !== "all") && <p className="text-xs text-muted-foreground mt-1">Try clearing your filters.</p>}
            </div>
          )}

          {rows.length > shown.length && (
            <div className="flex justify-center pt-3">
              <Button variant="outline" className="rounded-full text-xs" onClick={() => setVisible((v) => v + PAGE)}>
                Show more ({rows.length - shown.length} left)
              </Button>
            </div>
          )}
        </div>

        {/* ───────── Detail panel ───────── */}
        {selectedId && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-background lg:static lg:inset-auto lg:z-auto lg:overflow-visible lg:bg-transparent lg:w-[460px] lg:shrink-0">
            <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:shadow-sm">
              <AdminOrderDetail
                embeddedId={selectedId}
                onClose={() => setSelectedId(null)}
                onChanged={onRefresh}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      {checked.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background rounded-full shadow-xl px-4 py-2 flex items-center gap-3 text-xs font-semibold">
          <span>{checked.size} selected</span>
          <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-full bg-background/15 hover:bg-background/25 px-3 py-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => setChecked(new Set())} className="flex items-center gap-1 opacity-80 hover:opacity-100" aria-label="Clear selection">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      )}
    </div>
  );
    }

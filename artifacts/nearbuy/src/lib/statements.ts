// Monthly payout statements, shared by the admin Finance tab and the seller Earnings screen,
// so both show the same numbers. Uses the one commission formula in ./commission.

import { sellerNet, platformFee } from "./commission";

export interface StatementOrder {
  id: string;
  created_at: string;
  total?: number | null;
  amount?: number | null;
  admin_status?: string | null;
  payout_id?: string | null;
}

export interface PayoutRow {
  id: string;
  store_id: string;
  gross: number;
  commission: number;
  amount: number;
  order_count: number;
  note?: string | null;
  paid_at: string;
}

export interface MonthlyStatement {
  month: string; // "2026-10"
  label: string; // "October 2026"
  orders: number;
  gross: number;
  commission: number;
  net: number;
  paidOrders: number;
  owedOrders: number;
  paidNet: number;
  owedNet: number;
}

// Only delivered/completed orders are ever payable (same rule as the Finance tab).
export const isPayable = (o: StatementOrder) => o.admin_status === "delivered" || o.admin_status === "completed";

const orderValue = (o: StatementOrder) => Number(o.total ?? o.amount ?? 0);

export function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

/** One row per month (newest first) for a single store's orders. */
export function buildMonthlyStatements(orders: StatementOrder[]): MonthlyStatement[] {
  const byMonth = new Map<string, { all: number; paid: number; owed: number; orders: number; paidOrders: number; owedOrders: number }>();

  for (const o of orders.filter(isPayable)) {
    const key = monthKey(o.created_at);
    const row = byMonth.get(key) || { all: 0, paid: 0, owed: 0, orders: 0, paidOrders: 0, owedOrders: 0 };
    const value = orderValue(o);
    row.all += value;
    row.orders += 1;
    if (o.payout_id) { row.paid += value; row.paidOrders += 1; }
    else { row.owed += value; row.owedOrders += 1; }
    byMonth.set(key, row);
  }

  return Array.from(byMonth.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, r]) => ({
      month: key,
      label: monthLabel(key),
      orders: r.orders,
      gross: r.all,
      commission: platformFee(r.all),
      net: sellerNet(r.all),
      paidOrders: r.paidOrders,
      owedOrders: r.owedOrders,
      paidNet: sellerNet(r.paid),
      owedNet: sellerNet(r.owed),
    }));
}

/** What is still owed to a store right now (delivered orders with no payout yet). */
export function amountOwed(orders: StatementOrder[]): number {
  const owedGross = orders.filter((o) => isPayable(o) && !o.payout_id).reduce((s, o) => s + orderValue(o), 0);
  return sellerNet(owedGross);
}

/** What has been paid out so far, from the recorded payouts. */
export function amountPaid(payouts: PayoutRow[]): number {
  return payouts.reduce((s, p) => s + Number(p.amount || 0), 0);
}

const csvCell = (v: string | number) => {
  const text = String(v ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function statementsToCsv(storeName: string, statements: MonthlyStatement[], payouts: PayoutRow[]): string {
  const lines: (string | number)[][] = [
    [`KAT statement for ${storeName}`],
    [],
    ["Month", "Orders", "Buyers paid (NGN)", "KAT commission (NGN)", "Your earnings (NGN)", "Paid (NGN)", "Still owed (NGN)"],
    ...statements.map((s) => [s.label, s.orders, s.gross, s.commission, s.net, s.paidNet, s.owedNet]),
    [],
    ["Payouts"],
    ["Date", "Orders covered", "Amount paid (NGN)", "Note"],
    ...payouts.map((p) => [new Date(p.paid_at).toLocaleDateString("en-NG"), p.order_count, p.amount, p.note || ""]),
  ];
  return lines.map((row) => row.map(csvCell).join(",")).join("\n");
}

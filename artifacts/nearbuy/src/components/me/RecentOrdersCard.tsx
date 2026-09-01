import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Package } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import BuyerOrderDialog from "@/components/BuyerOrderDialog";
import AttentionBanner from "./AttentionBanner";
import OrderRow, { type OrderRowOrder, type OrderRowProduct } from "./OrderRow";

const RECENT_ORDERS_SHOWN = 3;

const ORDER_COLUMNS =
  "id, product_id, admin_status, buyer_address, total, amount, created_at, quantity, variant, delivery_area, delivery_state";

interface RecentOrdersCardProps {
  userId: string;
}

export default function RecentOrdersCard({ userId }: RecentOrdersCardProps) {
  const [orders, setOrders] = useState<OrderRowOrder[]>([]);
  const [products, setProducts] = useState<Record<string, OrderRowProduct>>({});
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRowOrder | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErrored(false);

      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false })
        .limit(RECENT_ORDERS_SHOWN);

      if (cancelled) return;

      if (error || !ordersData) {
        setErrored(true);
        setLoading(false);
        return;
      }

      setOrders(ordersData);

      const productIds = [...new Set(ordersData.map((o) => o.product_id).filter(Boolean))] as string[];
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, title, image_url")
          .in("id", productIds);

        if (!cancelled && productsData) {
          const map: Record<string, OrderRowProduct> = {};
          productsData.forEach((p) => { map[p.id] = { title: p.title, image_url: p.image_url }; });
          setProducts(map);
        }
      }

      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Orders</p>
        <div className="bg-card border border-card-border rounded-2xl p-5 text-center">
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (errored) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Orders</p>
        <div className="bg-card border border-card-border rounded-2xl p-5 text-center">
          <p className="text-sm text-muted-foreground">Couldn't load your orders right now.</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Orders</p>
        <div className="bg-card border border-card-border rounded-2xl p-5 text-center">
          <Package className="w-9 h-9 text-muted-foreground mx-auto mb-2" />
          <p className="font-bold text-sm">No orders yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your orders will appear here once you make a purchase.</p>
          <Link href="/">
            <Button size="sm" className="rounded-full mt-3">Start Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  const attentionOrder = orders.find((o) => o.admin_status === "out_for_delivery") ?? null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Orders</p>

      {attentionOrder && (
        <AttentionBanner order={attentionOrder} onSelect={(o) => setSelectedOrder(orders.find((full) => full.id === o.id) ?? null)} />
      )}

      <div className="space-y-2">
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            product={order.product_id ? products[order.product_id] : undefined}
            onSelect={setSelectedOrder}
          />
        ))}
      </div>

      <BuyerOrderDialog
        open={!!selectedOrder}
        order={selectedOrder}
        product={selectedOrder?.product_id ? products[selectedOrder.product_id] : null}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
  }

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Package, LogIn, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

interface AwaitingReviewOrder {
  order_id: string;
  product_id: string;
  seller_id: string;
  product_title: string | null;
  product_image: string | null;
  updated_at: string | null;
}

interface SubmittedReview {
  id: string;
  order_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
          <Star className={`w-7 h-7 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const [awaiting, setAwaiting] = useState<AwaitingReviewOrder[]>([]);
  const [submitted, setSubmitted] = useState<SubmittedReview[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<AwaitingReviewOrder | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data: awaitingData } = await supabase
      .from("orders_awaiting_review")
      .select("order_id, product_id, seller_id, product_title, product_image, updated_at")
      .eq("buyer_id", user.id);

    const { data: submittedData } = await supabase
      .from("reviews")
      .select("id, order_id, product_id, rating, comment, created_at")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    setAwaiting(awaitingData || []);
    setSubmitted(submittedData || []);

    const productIds = Array.from(new Set([
      ...(awaitingData || []).map((o) => o.product_id),
      ...(submittedData || []).map((r) => r.product_id),
    ].filter(Boolean)));

    if (productIds.length > 0) {
      const { data: productsData } = await supabase
        .from("products")
        .select("id, title, image_url")
        .in("id", productIds);
      const map: Record<string, any> = {};
      (productsData || []).forEach((p) => { map[p.id] = p; });
      setProducts(map);
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const openReviewFor = (order: AwaitingReviewOrder) => {
    setActiveOrder(order);
    setRating(5);
    setComment("");
    setSubmitError(null);
  };

  const submitReview = async () => {
    if (!activeOrder || !user) return;
    setSubmitting(true);
    setSubmitError(null);

    const { error } = await supabase.from("reviews").insert({
      order_id: activeOrder.order_id,
      buyer_id: user.id,
      seller_id: activeOrder.seller_id,
      product_id: activeOrder.product_id,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      // RLS will reject this if the order somehow isn't actually delivered —
      // surface that plainly rather than a generic failure.
      setSubmitError("Couldn't submit this review. Please try again.");
      setSubmitting(false);
      return;
    }

    setActiveOrder(null);
    setSubmitting(false);
    load();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3 p-6">
        <LogIn className="w-10 h-10 text-muted-foreground" />
        <p className="font-semibold">Sign in required</p>
        <Link href="/"><Button className="rounded-full">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/me">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-base font-black flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" /> Reviews
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
        ) : (
          <>
            {awaiting.length > 0 && (
              <section className="space-y-2.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Awaiting Your Review ({awaiting.length})
                </p>
                {awaiting.map((o) => {
                  const product = products[o.product_id];
                  return (
                    <div key={o.order_id} className="bg-card border border-card-border rounded-2xl p-3.5 flex items-center gap-3">
                      {product?.image_url || o.product_image ? (
                        <img src={product?.image_url || o.product_image!} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <p className="flex-1 text-sm font-semibold truncate">{product?.title || o.product_title || "Product"}</p>
                      <Button size="sm" className="rounded-full shrink-0" onClick={() => openReviewFor(o)}>
                        Leave a review
                      </Button>
                    </div>
                  );
                })}
              </section>
            )}

            <section className="space-y-2.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Your Reviews ({submitted.length})
              </p>
              {submitted.length === 0 ? (
                <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
                  <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No reviews left yet</p>
                </div>
              ) : (
                submitted.map((r) => {
                  const product = products[r.product_id];
                  return (
                    <div key={r.id} className="bg-card border border-card-border rounded-2xl p-3.5 space-y-1.5">
                      <div className="flex items-center gap-3">
                        {product?.image_url ? (
                          <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-sm font-semibold truncate flex-1">{product?.title || "Product"}</p>
                        <div className="flex gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-xs text-muted-foreground pl-[52px]">{r.comment}</p>}
                    </div>
                  );
                })
              )}
            </section>
          </>
        )}
      </main>

      <AnimatePresence>
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
            onClick={() => setActiveOrder(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="bg-card border border-card-border rounded-3xl p-6 max-w-sm w-full shadow-xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base">Rate your purchase</h3>
                <button onClick={() => setActiveOrder(null)} aria-label="Close" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {products[activeOrder.product_id]?.title || activeOrder.product_title || "Product"}
              </p>
              <StarPicker value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share a few words about it (optional)"
                className="w-full text-sm bg-muted rounded-xl p-3 resize-none h-24 outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary"
              />
              {submitError && <p className="text-xs text-destructive">{submitError}</p>}
              <Button className="w-full rounded-full" onClick={submitReview} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
      }

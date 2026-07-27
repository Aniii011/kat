import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, Power, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatNaira(n: number) { return "₦" + Number(n || 0).toLocaleString("en-NG"); }

interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  usage_limit: number | null;
  times_used: number;
  active: boolean;
  expires_at: string | null;
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (data) setCoupons(data);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setDiscountType("percent");
    setDiscountValue("");
    setMinOrder("");
    setUsageLimit("");
    setExpiresAt("");
    setFormError("");
    setShowForm(false);
  };

  const openEditForm = (c: Coupon) => {
    setEditingId(c.id);
    setCode(c.code);
    setDiscountType(c.discount_type);
    setDiscountValue(String(c.discount_value));
    setMinOrder(String(c.min_order_amount || 0));
    setUsageLimit(c.usage_limit ? String(c.usage_limit) : "");
    setExpiresAt(c.expires_at ? c.expires_at.slice(0, 10) : "");
    setFormError("");
    setShowForm(true);
  };

  const saveCoupon = async () => {
    if (!code.trim() || !discountValue.trim()) {
      setFormError("Code and discount value are required.");
      return;
    }
    const value = Number(discountValue);
    if (isNaN(value) || value <= 0) {
      setFormError("Discount value must be a positive number.");
      return;
    }
    if (discountType === "percent" && value > 100) {
      setFormError("Percentage discount can't exceed 100.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: value,
      min_order_amount: minOrder.trim() ? Number(minOrder) : 0,
      usage_limit: usageLimit.trim() ? Number(usageLimit) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    if (editingId) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editingId);
      if (error) { setFormError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("coupons").insert({ ...payload, active: true, times_used: 0 });
      if (error) { setFormError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    resetForm();
    fetchCoupons();
  };

  const toggleActive = async (c: Coupon) => {
    setActionLoading(c.id);
    await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    setCoupons((prev) => prev.map((x) => x.id === c.id ? { ...x, active: !x.active } : x));
    setActionLoading(null);
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm("Delete this coupon? This can't be undone.")) return;
    setActionLoading(id);
    await supabase.from("coupons").delete().eq("id", id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    setActionLoading(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Coupons ({coupons.length})</h2>
        <Button size="sm" className="rounded-full gap-1.5" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-3.5 h-3.5" /> Add Coupon
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm">{editingId ? "Edit Coupon" : "Add Coupon"}</p>
            <button onClick={resetForm} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <Input
            placeholder="Code (e.g. WELCOME10)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="rounded-xl h-11 font-mono"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setDiscountType("percent")}
              className={`flex-1 h-11 rounded-xl border-2 text-sm font-semibold transition-all ${discountType === "percent" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
            >
              % Percent Off
            </button>
            <button
              onClick={() => setDiscountType("fixed")}
              className={`flex-1 h-11 rounded-xl border-2 text-sm font-semibold transition-all ${discountType === "fixed" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
            >
              ₦ Fixed Amount
            </button>
          </div>

          <Input
            placeholder={discountType === "percent" ? "Discount % (e.g. 10)" : "Discount ₦ (e.g. 1000)"}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            type="number"
            className="rounded-xl h-11"
          />

          <Input
            placeholder="Minimum order amount (optional)"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            type="number"
            className="rounded-xl h-11"
          />

          <Input
            placeholder="Usage limit — leave blank for unlimited"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            type="number"
            className="rounded-xl h-11"
          />

          <div>
            <p className="text-xs text-muted-foreground mb-1">Expiry date (optional)</p>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {formError && <p className="text-xs text-destructive font-medium">{formError}</p>}

          <div className="flex gap-2">
            <Button className="flex-1 rounded-full" onClick={saveCoupon} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Coupon"}
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
          <p className="text-sm text-muted-foreground">Loading coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
          <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-sm">No coupons yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create a code buyers can apply at checkout.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-sm">{c.code}</p>
                  {!c.active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">Disabled</span>
                  )}
                  {c.expires_at && new Date(c.expires_at) < new Date() && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">Expired</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.discount_type === "percent" ? `${c.discount_value}% off` : `${formatNaira(c.discount_value)} off`}
                  {c.min_order_amount > 0 && ` · Min ${formatNaira(c.min_order_amount)}`}
                  {c.usage_limit && ` · ${c.times_used}/${c.usage_limit} used`}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => toggleActive(c)}
                  disabled={actionLoading === c.id}
                  title={c.active ? "Disable" : "Enable"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${c.active ? "bg-emerald-100 hover:bg-emerald-200" : "bg-muted hover:bg-accent"}`}
                >
                  <Power className={`w-3.5 h-3.5 ${c.active ? "text-emerald-700" : "text-muted-foreground"}`} />
                </button>
                <button onClick={() => openEditForm(c)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteCoupon(c.id)} disabled={actionLoading === c.id} className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
    }

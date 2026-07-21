import React from "react";
import { Check, X, Eye, Mail, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function SellerCard({
  seller,
  products,
  orders,
  revenue,
  approveSeller,
  rejectSeller,
  actionLoading,
}: any) {

const verified = seller.seller_verified;

const trustScore =
Math.min(
100,
70 +
(products.length > 5 ? 10 : 0) +
(orders.length > 10 ? 10 : 0) +
(verified ? 10 : 0)
);


return (

<div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">


<div className="flex items-start gap-3">


<div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
<span className="text-sm font-black text-primary">
{(seller.full_name || seller.email || "?")
.slice(0,2)
.toUpperCase()}
</span>
</div>


<div className="flex-1">

<div className="flex items-center gap-2">

<p className="font-bold text-sm">
{seller.full_name || "Unnamed"}
</p>


<span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
verified
? "bg-emerald-100 text-emerald-700"
: "bg-amber-100 text-amber-700"
}`}>

{verified ? "Verified" : "Pending"}

</span>

</div>


<p className="text-[11px] text-muted-foreground">
{seller.email}
</p>


</div>


</div>


{/* Seller Stats */}

<div className="grid grid-cols-3 gap-2">


<div className="bg-muted rounded-xl p-2">
<p className="text-[10px] text-muted-foreground">
Products
</p>
<p className="font-black text-sm">
{products.length}
</p>
</div>


<div className="bg-muted rounded-xl p-2">
<p className="text-[10px] text-muted-foreground">
Orders
</p>
<p className="font-black text-sm">
{orders.length}
</p>
</div>


<div className="bg-muted rounded-xl p-2">
<p className="text-[10px] text-muted-foreground">
Revenue
</p>
<p className="font-black text-sm">
₦{revenue.toLocaleString()}
</p>
</div>


</div>


{/* Trust Score */}

<div>

<div className="flex justify-between text-xs mb-1">
<span className="font-semibold">
Trust Score
</span>

<span className="font-black text-primary">
{trustScore}/100
</span>

</div>


<div className="h-2 bg-muted rounded-full overflow-hidden">

<div
className="h-full bg-primary rounded-full"
style={{width:`${trustScore}%`}}
/>

</div>

</div>


{/* Actions */}

<div className="flex gap-2">


{!verified && (
<Button
size="sm"
onClick={()=>approveSeller(seller.id)}
disabled={actionLoading===seller.id}
className="rounded-full text-xs"
>
<Check className="w-3 h-3 mr-1"/>
Verify
</Button>
)}


{verified && (
<Button
size="sm"
variant="outline"
onClick={()=>rejectSeller(seller.id)}
className="rounded-full text-xs"
>
<X className="w-3 h-3 mr-1"/>
Revoke
</Button>
)}


<Link href={`/store/${seller.id}`}>
<Button
size="sm"
variant="outline"
className="rounded-full text-xs"
>
<Eye className="w-3 h-3 mr-1"/>
Store
</Button>
</Link>


</div>


</div>

);

  }

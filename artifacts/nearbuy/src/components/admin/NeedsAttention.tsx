import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

export default function NeedsAttention({
  pendingSellers,
  pendingOrders,
  setSection,
}: any) {

return (
<div className="bg-card border border-card-border rounded-2xl p-4">

<p className="font-bold text-sm mb-3">
Needs Attention
</p>


<div className="space-y-2">

{pendingSellers > 0 && (
<div className="flex items-center justify-between bg-amber-50 rounded-xl p-3">

<p className="text-xs font-semibold">
<AlertTriangle className="w-3.5 h-3.5 inline -mt-0.5 mr-1" /> {pendingSellers} sellers waiting for approval
</p>

<button
onClick={()=>setSection("sellers")}
className="text-xs font-bold text-primary"
>
Review
</button>

</div>
)}


{pendingOrders > 0 && (
<div className="flex items-center justify-between bg-red-50 rounded-xl p-3">

<p className="text-xs font-semibold">
<AlertCircle className="w-3.5 h-3.5 inline -mt-0.5 mr-1" /> {pendingOrders} orders need attention
</p>

<button
onClick={()=>setSection("orders")}
className="text-xs font-bold text-primary"
>
View
</button>

</div>
)}


{pendingSellers === 0 && pendingOrders === 0 && (
<div className="bg-emerald-50 rounded-xl p-3">
<p className="text-xs font-semibold text-emerald-700">
<CheckCircle2 className="w-3.5 h-3.5 inline -mt-0.5 mr-1" /> Everything is running smoothly
</p>
</div>
)}

</div>

</div>
);

}

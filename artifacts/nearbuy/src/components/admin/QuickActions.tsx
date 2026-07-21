import React from "react";

export default function QuickActions({ setSection }: any) {

const actions = [
  {
    label: "Verify Sellers",
    section: "sellers",
    style: "bg-primary/10 text-primary"
  },
  {
    label: "Review Products",
    section: "products",
    style: "bg-muted"
  },
  {
    label: "Manage Orders",
    section: "orders",
    style: "bg-muted"
  },
  {
    label: "Reports",
    section: "reports",
    style: "bg-muted"
  },
];


return (
<div className="bg-card border border-card-border rounded-2xl p-4">

<p className="font-bold text-sm mb-3">
Quick Actions
</p>

<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

{actions.map((action)=>(
<button
key={action.label}
onClick={()=>setSection(action.section)}
className={`rounded-xl p-3 text-xs font-bold transition hover:scale-[1.02] ${action.style}`}
>
{action.label}
</button>
))}

</div>

</div>
);

}

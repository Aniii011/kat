import React from "react";
import { DollarSign, ShoppingCart, Users, Store } from "lucide-react";

export default function AdminStats({
  revenueToday,
  ordersToday,
  usersToday,
  sellersToday,
  pendingSellers,
  formatNaira,
}: any) {

const stats = [
  {
    label: "Revenue Today",
    value: formatNaira(revenueToday),
    sub: `${ordersToday} orders`,
    icon: <DollarSign className="w-4 h-4 text-primary" />
  },
  {
    label: "Orders Today",
    value: ordersToday,
    sub: "new orders",
    icon: <ShoppingCart className="w-4 h-4 text-primary" />
  },
  {
    label: "New Users",
    value: usersToday,
    sub: "joined today",
    icon: <Users className="w-4 h-4 text-primary" />
  },
  {
    label: "New Sellers",
    value: sellersToday,
    sub: `${pendingSellers} pending`,
    icon: <Store className="w-4 h-4 text-primary" />
  }
];


return (
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

{stats.map((s)=>(
<div
key={s.label}
className="bg-card border border-card-border rounded-2xl p-4"
>

{s.icon}

<p className="text-xl font-black mt-2">
{s.value}
</p>

<p className="text-xs font-semibold">
{s.label}
</p>

<p className="text-[10px] text-muted-foreground">
{s.sub}
</p>

</div>
))}

</div>
);

}

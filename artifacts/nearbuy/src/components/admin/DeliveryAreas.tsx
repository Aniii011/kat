import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Plus, Power } from "lucide-react";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

export default function DeliveryAreas() {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [fee, setFee] = useState("");

  const fetchAreas = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("delivery_areas")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setAreas(data);

    setLoading(false);
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const addArea = async () => {
    if (!state || !city || !fee) return;

    await supabase.from("delivery_areas").insert({
      state,
      city,
      delivery_fee: Number(fee),
    });

    setState("");
    setCity("");
    setFee("");

    fetchAreas();
  };


  const toggleArea = async (id: string, active: boolean) => {
    await supabase
      .from("delivery_areas")
      .update({ active: !active })
      .eq("id", id);

    fetchAreas();
  };


  const deleteArea = async (id: string) => {
    if (!confirm("Delete this delivery area?")) return;

    await supabase
      .from("delivery_areas")
      .delete()
      .eq("id", id);

    fetchAreas();
  };


  return (
    <div className="space-y-5">

      <div>
        <h2 className="text-lg font-black">
          Delivery Areas
        </h2>

        <p className="text-sm text-muted-foreground">
          Manage where KAT delivers and delivery fees.
        </p>
      </div>


      {/* Add Area */}

      <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">

        <p className="font-bold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Delivery Location
        </p>


        <Input
          placeholder="State (e.g Oyo)"
          value={state}
          onChange={(e)=>setState(e.target.value)}
        />


        <Input
          placeholder="City / Area (e.g Ibadan Bodija)"
          value={city}
          onChange={(e)=>setCity(e.target.value)}
        />


        <Input
          placeholder="Delivery Fee"
          type="number"
          value={fee}
          onChange={(e)=>setFee(e.target.value)}
        />


        <Button
          onClick={addArea}
          className="rounded-full"
        >
          Add Location
        </Button>

      </div>



      {/* List */}

      <div className="space-y-3">

        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading...
          </p>
        ) : areas.map((area)=>(
          
          <div
            key={area.id}
            className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3"
          >

            <div className="flex-1">

              <p className="font-bold">
                {area.city}
              </p>

              <p className="text-sm text-muted-foreground">
                {area.state} · {formatNaira(area.delivery_fee)}
              </p>

            </div>


            <Button
              size="icon"
              variant="outline"
              onClick={()=>toggleArea(area.id, area.active)}
            >
              <Power className="w-4 h-4" />
            </Button>


            <Button
              size="icon"
              variant="outline"
              onClick={()=>deleteArea(area.id)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>

          </div>

        ))}

      </div>

    </div>
  );
}

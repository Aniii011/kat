import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Plus, Power } from "lucide-react";
import { NIGERIAN_STATES } from "@/lib/nigeriaStates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

export default function DeliveryAreas() {
  const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [fee, setFee] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
const [editState, setEditState] = useState("");
const [editCity, setEditCity] = useState("");
const [editFee, setEditFee] = useState("");

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

    const updateArea = async () => {
  if (!editingId) return;

  await supabase
    .from("delivery_areas")
    .update({
      state: editState,
      city: editCity,
      delivery_fee: Number(editFee),
    })
    .eq("id", editingId);

  setEditingId(null);
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


        <Select value={state} onValueChange={setState}>
  <SelectTrigger>
    <SelectValue placeholder="Select State" />
  </SelectTrigger>

  <SelectContent>
    {NIGERIAN_STATES.map((s) => (
      <SelectItem key={s} value={s}>
        {s}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

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
        {editingId && (
  <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
    <h3 className="font-bold">Edit Delivery Area</h3>

<Select value={editState} onValueChange={setEditState}>
  <SelectTrigger>
    <SelectValue placeholder="Select State" />
  </SelectTrigger>

  <SelectContent>
    {NIGERIAN_STATES.map((s) => (
      <SelectItem key={s} value={s}>
        {s}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
    
    <Input
      value={editCity}
      onChange={(e) => setEditCity(e.target.value)}
      placeholder="City / Area"
    />

    <Input
      type="number"
      value={editFee}
      onChange={(e) => setEditFee(e.target.value)}
      placeholder="Delivery Fee"
    />

    <div className="flex gap-2">
      <Button
        onClick={updateArea}
        className="rounded-full"
      >
        Save
      </Button>

      <Button
        variant="outline"
        onClick={() => setEditingId(null)}
        className="rounded-full"
      >
        Cancel
      </Button>
    </div>
  </div>
)}

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
  onClick={() => {
    setEditingId(area.id);
    setEditState(area.state);
    setEditCity(area.city);
    setEditFee(String(area.delivery_fee));
  }}
>
  <Pencil className="w-4 h-4" />
</Button>

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

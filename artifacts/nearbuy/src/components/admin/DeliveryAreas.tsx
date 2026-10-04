import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Plus, Power, Search, ChevronDown, ChevronRight } from "lucide-react";
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
  const [doorFee, setDoorFee] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [areaSearch, setAreaSearch] = useState("");
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());

  const toggleStateExpanded = (s: string) => {
    setExpandedStates((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };
const [editState, setEditState] = useState("");
const [editCity, setEditCity] = useState("");
const [editFee, setEditFee] = useState("");
const [editDoorFee, setEditDoorFee] = useState("");
const [editNote, setEditNote] = useState("");

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
    setSaveError(null);
    const missing: string[] = [];
    if (!state) missing.push("State");
    if (!city) missing.push("City / Area");
    // Some areas are doorstep-delivery-only — park/standard pickup isn't
    // always offered there. So only require that AT LEAST ONE of the two
    // fees is set, not specifically the standard one.
    if (!fee && !doorFee) missing.push("either a Standard/Park fee or a Door Delivery fee");
    if (missing.length > 0) {
      setSaveError(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    const { error } = await supabase.from("delivery_areas").insert({
      state,
      city,
      delivery_fee: fee ? Number(fee) : null,
      door_delivery_fee: doorFee ? Number(doorFee) : null,
      delivery_note: note.trim() || null,
    });

    if (error) {
      setSaveError(error.message);
      return; // don't clear the form or refetch — nothing was actually saved
    }

    setState("");
    setCity("");
    setFee("");
    setDoorFee("");
    setNote("");

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
  setSaveError(null);

  if (!editFee && !editDoorFee) {
    setSaveError("Please fill in either a Standard/Park fee or a Door Delivery fee");
    return;
  }

  const { error } = await supabase
    .from("delivery_areas")
    .update({
      state: editState,
      city: editCity,
      delivery_fee: editFee ? Number(editFee) : null,
      door_delivery_fee: editDoorFee ? Number(editDoorFee) : null,
      delivery_note: editNote.trim() || null,
    })
    .eq("id", editingId);

  if (error) {
    setSaveError(error.message);
    return; // keep the edit form open so nothing looks silently lost
  }

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

  <SelectContent className="max-h-64 overflow-y-auto">
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
          placeholder="Standard/Park Delivery Fee"
          type="number"
          value={fee}
          onChange={(e)=>setFee(e.target.value)}
        />

        <Input
          placeholder="Door Delivery Fee (optional)"
          type="number"
          value={doorFee}
          onChange={(e)=>setDoorFee(e.target.value)}
        />

        <textarea
          placeholder="Delivery-time note shown to buyers (e.g. 'East delivery: 5–8 days after handoff to logistics due to distance')"
          value={note}
          onChange={(e)=>setNote(e.target.value)}
          className="w-full min-h-[70px] rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />

        {saveError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{saveError}</p>
        )}

        <Button
          onClick={addArea}
          className="rounded-full"
        >
          Add Location
        </Button>

      </div>



      {/* List */}

      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={areaSearch}
          onChange={(e) => setAreaSearch(e.target.value)}
          placeholder="Search by state or area..."
          className="pl-9 rounded-full"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading...
          </p>
        ) : (() => {
          const q = areaSearch.trim().toLowerCase();
          const filtered = q
            ? areas.filter((a) => a.state?.toLowerCase().includes(q) || a.city?.toLowerCase().includes(q))
            : areas;

          // Grouped by state so adding many areas under one state (e.g. 10
          // under Oyo) doesn't turn into one long flat list to scroll
          // through — each state is its own collapsible section.
          const byState: Record<string, any[]> = {};
          filtered.forEach((a) => {
            if (!byState[a.state]) byState[a.state] = [];
            byState[a.state].push(a);
          });
          const stateNames = Object.keys(byState).sort();

          if (stateNames.length === 0) {
            return <p className="text-sm text-muted-foreground">No delivery areas match "{areaSearch}".</p>;
          }

          return stateNames.map((stateName) => {
            // While searching, every matching state auto-expands so results
            // are visible immediately without also having to tap each one.
            const isExpanded = q.length > 0 || expandedStates.has(stateName);
            const stateAreas = byState[stateName];

            return (
              <div key={stateName} className="bg-card border border-card-border rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleStateExpanded(stateName)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <span className="font-bold">{stateName} <span className="text-muted-foreground font-normal">({stateAreas.length})</span></span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-card-border divide-y divide-card-border">
                    {stateAreas.map((area) => {
                      const isEditing = editingId === area.id;
                      return (
                        <div key={area.id} className="p-4">
                          {isEditing ? (
                            // Editing happens right here, in place of the row —
                            // not in a separate form elsewhere on the page,
                            // which was easy to miss in a long list.
                            <div className="space-y-3">
                              <Select value={editState} onValueChange={setEditState}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select State" />
                                </SelectTrigger>
                                <SelectContent className="max-h-64 overflow-y-auto">
                                  {NIGERIAN_STATES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="City / Area" />
                              <Input type="number" value={editFee} onChange={(e) => setEditFee(e.target.value)} placeholder="Standard/Park Delivery Fee" />
                              <Input type="number" value={editDoorFee} onChange={(e) => setEditDoorFee(e.target.value)} placeholder="Door Delivery Fee (optional)" />
                              <textarea
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="Delivery-time note shown to buyers"
                                className="w-full min-h-[70px] rounded-xl border border-input bg-background px-3 py-2 text-sm"
                              />

                              {saveError && (
                                <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{saveError}</p>
                              )}

                              <div className="flex gap-2">
                                <Button onClick={updateArea} className="rounded-full">Save</Button>
                                <Button variant="outline" onClick={() => { setEditingId(null); setSaveError(null); }} className="rounded-full">Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <p className="font-bold">{area.city}</p>
                                <p className="text-sm text-muted-foreground">
                                  {area.delivery_fee != null ? formatNaira(area.delivery_fee) : "Doorstep only"}
                                  {area.door_delivery_fee ? ` · Door: ${formatNaira(area.door_delivery_fee)}` : ""}
                                </p>
                                {area.delivery_note && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">{area.delivery_note}</p>
                                )}
                              </div>

                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => {
                                  setSaveError(null);
                                  setEditingId(area.id);
                                  setEditState(area.state);
                                  setEditCity(area.city);
                                  setEditFee(area.delivery_fee != null ? String(area.delivery_fee) : "");
                                  setEditDoorFee(area.door_delivery_fee != null ? String(area.door_delivery_fee) : "");
                                  setEditNote(area.delivery_note || "");
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>

                              <Button size="icon" variant="outline" onClick={() => toggleArea(area.id, area.active)}>
                                <Power className="w-4 h-4" />
                              </Button>

                              <Button size="icon" variant="outline" onClick={() => deleteArea(area.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>

    </div>
  );
          }

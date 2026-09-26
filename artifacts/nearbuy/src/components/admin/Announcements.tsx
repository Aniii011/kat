import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Power } from "lucide-react";

export default function Announcements() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_announcements").select("*").order("created_at", { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const addItem = async () => {
    if (!text.trim()) return;
    await supabase.from("site_announcements").insert({ text: text.trim(), active: true });
    setText("");
    fetchItems();
  };

  const toggleItem = async (id: string, active: boolean) => {
    await supabase.from("site_announcements").update({ active: !active }).eq("id", id);
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("site_announcements").delete().eq("id", id);
    fetchItems();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black">Home Page Announcements</h2>
        <p className="text-sm text-muted-foreground">
          These rotate in the banner at the top of the home page. Use this for delay notices, logistics updates, or general promos — buyers only see the ones marked active.
        </p>
      </div>

      <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
        <Input
          placeholder="e.g. Delayed deliveries to the East this week due to road construction"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button onClick={addItem} className="rounded-full">Add Announcement</Button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet — the home page will show its default rotating messages.</p>
        ) : items.map((item) => (
          <div key={item.id} className="bg-card border border-card-border rounded-2xl p-3 flex items-center gap-3">
            <p className={`flex-1 text-sm ${item.active ? "" : "text-muted-foreground line-through"}`}>{item.text}</p>
            <Button size="icon" variant="outline" onClick={() => toggleItem(item.id, item.active)} title={item.active ? "Turn off" : "Turn on"}>
              <Power className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => deleteItem(item.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
      }

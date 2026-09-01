import { useEffect, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface StyleProfileCardProps {
  userId: string;
  initialSelected: string[];
}

export default function StyleProfileCard({ userId, initialSelected }: StyleProfileCardProps) {
  const [vocabulary, setVocabulary] = useState<string[]>([]);
  const [loadingVocabulary, setLoadingVocabulary] = useState(true);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadVocabulary = async () => {
      const { data, error } = await supabase.from("listings").select("aesthetics");
      if (cancelled || error || !data) {
        setLoadingVocabulary(false);
        return;
      }
      const unique = new Set<string>();
      data.forEach((row) => {
        (row.aesthetics ?? []).forEach((tag: string) => {
          if (tag) unique.add(tag);
        });
      });
      setVocabulary(Array.from(unique).sort());
      setLoadingVocabulary(false);
    };

    loadVocabulary();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setDirty(true);
    setSaveError(false);
  };

  const save = async () => {
    setSaving(true);
    setSaveError(false);
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_aesthetics: selected })
      .eq("id", userId);

    setSaving(false);
    if (error) {
      setSaveError(true);
      return;
    }
    setDirty(false);
  };

  if (loadingVocabulary) {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-4">
        <p className="text-sm text-muted-foreground">Loading style options...</p>
      </div>
    );
  }

  if (vocabulary.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
      <div>
        <p className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Your Style
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pick a few aesthetics you love. Optional — skip anytime.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {vocabulary.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(tag)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {tag}
            </button>
          );
        })}
      </div>

      {dirty && (
        <div className="flex items-center gap-2">
          <Button size="sm" className="rounded-full" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {saveError && (
            <p className="text-xs text-destructive">Couldn't save — try again.</p>
          )}
        </div>
      )}
    </div>
  );
}

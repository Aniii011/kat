import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface NameDescriptionSectionProps {
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  showAIGenerate?: boolean;
  onGenerateAI?: () => void;
  generatingAI?: boolean;
  aiError?: string;
  namePlaceholder?: string;
}

export default function NameDescriptionSection({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  showAIGenerate = true,
  onGenerateAI,
  generatingAI = false,
  aiError,
  namePlaceholder = "Product name *",
}: NameDescriptionSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <Input
          placeholder={namePlaceholder}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="rounded-xl h-11"
        />
        {showAIGenerate && onGenerateAI && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full rounded-xl mt-2 text-xs gap-1.5"
              onClick={onGenerateAI}
              disabled={generatingAI}
            >
              ✨ {generatingAI ? "Generating..." : "Generate Title & Description with AI"}
            </Button>
            {aiError && <p className="text-[10px] text-destructive mt-1">{aiError}</p>}
          </>
        )}
      </div>
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="rounded-xl resize-none"
        rows={3}
      />
    </div>
  );
}

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoards, type Board } from "@/hooks/use-boards";
import { Check, Plus, X, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const BOARD_EMOJIS = ["📌", "🌴", "💅", "👗", "✨", "💜", "🔥", "💕", "🎀", "👜", "💪", "🌸"];

interface Props {
  open: boolean;
  onClose: () => void;
  listingId: number;
  listingTitle?: string;
}

export default function SaveToBoardModal({ open, onClose, listingId, listingTitle }: Props) {
  const { boards, createBoard, saveToBoard, removeFromBoard, getBoardsForItem } = useBoards();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📌");
  const [justSaved, setJustSaved] = useState<string | null>(null);

  const savedBoards = getBoardsForItem(listingId);
  const isSavedTo = (id: string) => savedBoards.some((b) => b.id === id);

  const toggleBoard = (board: Board) => {
    if (isSavedTo(board.id)) {
      removeFromBoard(board.id, listingId);
    } else {
      saveToBoard(board.id, listingId);
      setJustSaved(board.id);
      setTimeout(() => setJustSaved(null), 1500);
    }
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const board = createBoard(newName.trim(), selectedEmoji);
    saveToBoard(board.id, listingId);
    setJustSaved(board.id);
    setTimeout(() => setJustSaved(null), 1500);
    setNewName("");
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-sm mx-auto p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary" /> Save to board
          </DialogTitle>
          {listingTitle && (
            <p className="text-xs text-muted-foreground truncate">{listingTitle}</p>
          )}
        </DialogHeader>

        <div className="px-4 pb-2 max-h-[50vh] overflow-y-auto space-y-1.5">
          <AnimatePresence>
            {boards.map((board) => {
              const saved = isSavedTo(board.id);
              return (
                <motion.button
                  key={board.id}
                  onClick={() => toggleBoard(board)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                    saved
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  }`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-2xl">{board.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{board.name}</p>
                    <p className="text-[11px] text-muted-foreground">{board.itemIds.length} item{board.itemIds.length !== 1 ? "s" : ""}</p>
                  </div>
                  <motion.div
                    animate={{ scale: justSaved === board.id ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {saved ? (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-border" />
                    )}
                  </motion.div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="px-4 pb-5 pt-2 border-t border-border mt-1">
          <AnimatePresence mode="wait">
            {!creating ? (
              <motion.button
                key="create-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2.5 p-3 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:text-primary transition-all text-sm font-semibold text-muted-foreground"
              >
                <Plus className="w-4 h-4" /> Create new board
              </motion.button>
            ) : (
              <motion.div
                key="create-form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <div className="flex flex-wrap gap-1.5">
                  {BOARD_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setSelectedEmoji(e)}
                      className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                        selectedEmoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-accent"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Board name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="rounded-xl flex-1 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleCreate} disabled={!newName.trim()} className="rounded-xl px-4">
                    Create
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCreating(false)} className="rounded-xl px-3">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

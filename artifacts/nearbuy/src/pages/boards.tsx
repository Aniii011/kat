import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useBoards } from "@/hooks/use-boards";
import { listings as staticListings } from "@/data/listings";
import ThemeSwitcher from "@/components/theme-switcher";
import { ArrowLeft, Plus, Bookmark, Trash2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BOARD_EMOJIS = ["📌", "🌴", "💅", "👗", "✨", "💜", "🔥", "💕", "🎀", "👜", "💪", "🌸"];

export default function Boards() {
  const { boards, createBoard, deleteBoard } = useBoards();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📌");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createBoard(newName.trim(), selectedEmoji);
    setNewName("");
    setSelectedEmoji("📌");
    setCreating(false);
  };

  const getCoverImages = (itemIds: number[]) =>
    itemIds.slice(0, 4).map((id) => {
      const l = staticListings.find((x) => x.id === id);
      return l?.imageUrl ?? null;
    }).filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-black">My Boards</h1>
          </div>
          <ThemeSwitcher />
          <Button
            size="sm"
            className="rounded-full gap-1.5 font-semibold"
            onClick={() => setCreating(true)}
          >
            <Plus className="w-3.5 h-3.5" /> New Board
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Create board form */}
        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="bg-card border border-card-border rounded-3xl p-4 mb-6 space-y-3"
            >
              <h3 className="text-sm font-bold">Create a new board</h3>
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
                  placeholder="Board name, e.g. Summer Fits..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="rounded-xl flex-1"
                  autoFocus
                />
                <Button onClick={handleCreate} disabled={!newName.trim()} className="rounded-xl px-5">
                  Create
                </Button>
                <Button variant="ghost" onClick={() => setCreating(false)} className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-7 h-7 text-primary" />
            </div>
            <p className="font-bold text-base">No boards yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create a board to save your favourite looks</p>
            <Button size="sm" className="mt-4 rounded-full gap-1.5" onClick={() => setCreating(true)}>
              <Plus className="w-3.5 h-3.5" /> Create your first board
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <AnimatePresence>
              {boards.map((board, i) => {
                const covers = getCoverImages(board.itemIds);
                return (
                  <motion.div
                    key={board.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link href={`/boards/${board.id}`}>
                      <div className="group relative bg-card border border-card-border rounded-3xl overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300">
                        {/* Cover mosaic */}
                        <div className="aspect-[4/3] bg-muted grid grid-cols-2 gap-0.5 overflow-hidden">
                          {covers.length === 0 ? (
                            <div className="col-span-2 row-span-2 flex items-center justify-center text-4xl">
                              {board.emoji}
                            </div>
                          ) : covers.length === 1 ? (
                            <img src={covers[0]} className="col-span-2 row-span-2 w-full h-full object-cover" alt="" />
                          ) : (
                            covers.slice(0, 4).map((src, idx) => (
                              <img key={idx} src={src} className="w-full h-full object-cover" alt="" />
                            ))
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold leading-tight flex items-center gap-1.5">
                                <span>{board.emoji}</span>
                                <span className="truncate">{board.name}</span>
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {board.itemIds.length} item{board.itemIds.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.preventDefault(); setDeleteTarget(board.id); }}
                              className="w-7 h-7 rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this board?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the board and all saved items from it. Items won't be deleted from the shop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) { deleteBoard(deleteTarget); setDeleteTarget(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

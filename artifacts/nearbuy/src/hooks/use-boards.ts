import { useState, useEffect, useCallback } from "react";

export interface Board {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  itemIds: number[];
}

const STORAGE_KEY = "kat_boards";

const DEFAULT_BOARDS: Board[] = [
  { id: "b-vacation", name: "Vacation Fits", emoji: "🌴", createdAt: new Date().toISOString(), itemIds: [7, 8] },
  { id: "b-gym", name: "Gym Era", emoji: "💪", createdAt: new Date().toISOString(), itemIds: [12] },
  { id: "b-baddie", name: "Baddie Looks", emoji: "💅", createdAt: new Date().toISOString(), itemIds: [2, 13, 15] },
];

function loadBoards(): Board[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Board[];
  } catch {}
  return DEFAULT_BOARDS;
}

function saveBoards(boards: Board[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>(loadBoards);

  const persist = useCallback((next: Board[]) => {
    setBoards(next);
    saveBoards(next);
  }, []);

  const createBoard = useCallback((name: string, emoji = "📌") => {
    const board: Board = {
      id: `b-${Date.now()}`,
      name: name.trim(),
      emoji,
      createdAt: new Date().toISOString(),
      itemIds: [],
    };
    persist([...boards, board]);
    return board;
  }, [boards, persist]);

  const deleteBoard = useCallback((id: string) => {
    persist(boards.filter((b) => b.id !== id));
  }, [boards, persist]);

  const saveToBoard = useCallback((boardId: string, listingId: number) => {
    persist(boards.map((b) =>
      b.id === boardId
        ? { ...b, itemIds: b.itemIds.includes(listingId) ? b.itemIds : [...b.itemIds, listingId] }
        : b
    ));
  }, [boards, persist]);

  const removeFromBoard = useCallback((boardId: string, listingId: number) => {
    persist(boards.map((b) =>
      b.id === boardId ? { ...b, itemIds: b.itemIds.filter((id) => id !== listingId) } : b
    ));
  }, [boards, persist]);

  const isSaved = useCallback((listingId: number) =>
    boards.some((b) => b.itemIds.includes(listingId)), [boards]);

  const getBoardsForItem = useCallback((listingId: number) =>
    boards.filter((b) => b.itemIds.includes(listingId)), [boards]);

  return { boards, createBoard, deleteBoard, saveToBoard, removeFromBoard, isSaved, getBoardsForItem };
}

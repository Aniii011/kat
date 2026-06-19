import { useState, useCallback } from "react";

export interface CartItem {
  listingId: string;
  title: string;
  price: number;
  imageUrl: string;
  sellerName: string;
  sellerId?: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  variantImage?: string;
}

export interface SavedItem {
  listingId: string;
  title: string;
  price: number;
  imageUrl: string;
  sellerName: string;
}

const CART_KEY = "kat_cart";
const SAVED_KEY = "kat_saved";

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch { return []; }
}

function save<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => load<CartItem>(CART_KEY));
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => load<SavedItem>(SAVED_KEY));

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.listingId === item.listingId &&
          i.selectedSize === item.selectedSize &&
          i.selectedColor === item.selectedColor
      );
      const next = existing
        ? prev.map((i) => i === existing ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i)
        : [...prev, { ...item, quantity: item.quantity ?? 1 }];
      save(CART_KEY, next);
      return next;
    });
  }, []);

  const removeItem = useCallback((listingId: string, selectedSize?: string, selectedColor?: string) => {
    setItems((prev) => {
      const next = prev.filter(
        (i) => !(i.listingId === listingId && i.selectedSize === selectedSize && i.selectedColor === selectedColor)
      );
      save(CART_KEY, next);
      return next;
    });
  }, []);

  const updateQty = useCallback((listingId: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
    setItems((prev) => {
      const next = quantity < 1
        ? prev.filter((i) => !(i.listingId === listingId && i.selectedSize === selectedSize && i.selectedColor === selectedColor))
        : prev.map((i) =>
            i.listingId === listingId && i.selectedSize === selectedSize && i.selectedColor === selectedColor
              ? { ...i, quantity }
              : i
          );
      save(CART_KEY, next);
      return next;
    });
  }, []);

  const saveForLater = useCallback((item: SavedItem) => {
    setSavedItems((prev) => {
      if (prev.find((i) => i.listingId === item.listingId)) return prev;
      const next = [...prev, item];
      save(SAVED_KEY, next);
      return next;
    });
  }, []);

  const removeSaved = useCallback((listingId: string) => {
    setSavedItems((prev) => {
      const next = prev.filter((i) => i.listingId !== listingId);
      save(SAVED_KEY, next);
      return next;
    });
  }, []);

  const moveToCart = useCallback((item: SavedItem) => {
    removeSaved(item.listingId);
    addItem({ ...item, quantity: 1 });
  }, [addItem, removeSaved]);

  const clearCart = useCallback(() => {
    setItems([]);
    save(CART_KEY, []);
  }, []);

  const isInCart = useCallback((listingId: string) =>
    items.some((i) => i.listingId === listingId), [items]);

  const isSaved = useCallback((listingId: string) =>
    savedItems.some((i) => i.listingId === listingId), [savedItems]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return {
    items, savedItems,
    addItem, removeItem, updateQty,
    saveForLater, removeSaved, moveToCart,
    clearCart, isInCart, isSaved,
    totalItems, totalPrice,
  };
}

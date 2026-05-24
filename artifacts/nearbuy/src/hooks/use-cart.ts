import { useState, useCallback } from "react";

export interface CartItem {
  listingId: number;
  title: string;
  price: number;
  imageUrl: string;
  sellerName: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

const STORAGE_KEY = "kat_cart";

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch { return []; }
}

function save(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(load);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    save(next);
  }, []);

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
      save(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((listingId: number, selectedSize?: string, selectedColor?: string) => {
    setItems((prev) => {
      const next = prev.filter(
        (i) => !(i.listingId === listingId && i.selectedSize === selectedSize && i.selectedColor === selectedColor)
      );
      save(next);
      return next;
    });
  }, []);

  const updateQty = useCallback((listingId: number, quantity: number, selectedSize?: string, selectedColor?: string) => {
    setItems((prev) => {
      const next = quantity < 1
        ? prev.filter((i) => !(i.listingId === listingId && i.selectedSize === selectedSize && i.selectedColor === selectedColor))
        : prev.map((i) =>
            i.listingId === listingId && i.selectedSize === selectedSize && i.selectedColor === selectedColor
              ? { ...i, quantity }
              : i
          );
      save(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => persist([]), [persist]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const shareableLink = () => {
    const encoded = encodeURIComponent(JSON.stringify(items.map((i) => ({ id: i.listingId, qty: i.quantity, size: i.selectedSize, color: i.selectedColor }))));
    return `${window.location.origin}/cart?shared=${encoded}`;
  };

  return { items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice, shareableLink };
}

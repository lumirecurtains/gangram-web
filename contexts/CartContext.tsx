"use client";

// 🛒 Cart state — localStorage mein persist (refresh ke baad bhi yaad)

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CartLine, MenuItem } from "@/lib/types";

interface CartCtx {
  lines: CartLine[];
  count: number;
  total: number;
  add: (item: MenuItem) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx>(null!);

const KEY = "gangaram_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);

  const add = (item: MenuItem) =>
    setLines((prev) => {
      const found = prev.find((l) => l.item.id === item.id);
      if (found)
        return prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { item, qty: 1 }];
    });

  const setQty = (id: string, qty: number) =>
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.item.id !== id) : prev.map((l) => (l.item.id === id ? { ...l, qty } : l))
    );

  const clear = () => setLines([]);

  const count = useMemo(() => lines.reduce((a, l) => a + l.qty, 0), [lines]);
  const total = useMemo(() => lines.reduce((a, l) => a + l.qty * l.item.price, 0), [lines]);

  return <Ctx.Provider value={{ lines, count, total, add, setQty, clear }}>{children}</Ctx.Provider>;
}

export const useCart = () => useContext(Ctx);

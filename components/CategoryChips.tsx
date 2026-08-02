"use client";

// 🏷️ Category chips — horizontal scroll, active state (demo jaisa)

import { Category } from "@/lib/types";

export default function CategoryChips({
  categories,
  active,
  onSelect,
}: {
  categories: Category[];
  active: string;
  onSelect: (id: string) => void;
}) {
  if (!categories.length) return null;
  return (
    <div className="chips">
      {categories.map((c) => (
        <button
          key={c.id}
          className={`chip ${active === c.id ? "active" : ""}`}
          onClick={() => onSelect(c.id)}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

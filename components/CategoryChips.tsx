"use client";

// 🏷️ Category chips — horizontal scroll with 'Sabhi' (All) option

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
  return (
    <div className="chips">
      <button
        className={`chip ${active === "all" || !active ? "active" : ""}`}
        onClick={() => onSelect("all")}
      >
        🌟 Sabhi
      </button>
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

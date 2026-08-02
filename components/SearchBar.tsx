"use client";

// 🔍 Search — menu mein dish dhoondo (naam se, PRD feature #5)

import { useState } from "react";
import { MenuItem } from "@/lib/types";

export default function SearchBar({ items, onFilter }: { items: MenuItem[]; onFilter: (q: string) => void }) {
  const [q, setQ] = useState("");

  return (
    <div className="search-wrap">
      <span className="search-ico">🔍</span>
      <input
        className="search-input"
        placeholder="Dish dhoondo... (jaise: Paneer)"
        value={q}
        onChange={(e) => { setQ(e.target.value); onFilter(e.target.value); }}
      />
      {q && <button className="search-clear" onClick={() => { setQ(""); onFilter(""); }}>✕</button>}
    </div>
  );
}

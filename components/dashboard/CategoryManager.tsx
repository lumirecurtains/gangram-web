"use client";

// 🏷️ Category Manager — add/edit/delete/reorder categories

import { useState } from "react";
import { collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onCategories } from "@/lib/data";
import { Category } from "@/lib/types";
import { useEffect } from "react";

export default function CategoryManager() {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState("");

  useEffect(() => onCategories(setCats), []);

  async function addCat(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await addDoc(collection(db, "categories"), { name: name.trim(), order: cats.length });
    setName("");
  }

  async function move(c: Category, dir: number) {
    const idx = cats.findIndex((x) => x.id === c.id);
    const swap = cats[idx + dir];
    if (!swap) return;
    await updateDoc(doc(db, "categories", c.id), { order: swap.order });
    await updateDoc(doc(db, "categories", swap.id), { order: c.order });
  }

  async function rename(c: Category) {
    const newName = prompt("Naya naam:", c.name);
    if (newName?.trim()) await updateDoc(doc(db, "categories", c.id), { name: newName.trim() });
  }

  async function remove(c: Category) {
    if (confirm(`"${c.name}" delete karein? (us category ke dishes bhi hat jayenge menu se)`)) {
      await deleteDoc(doc(db, "categories", c.id));
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: 17, marginBottom: 12 }}>🏷️ Categories ({cats.length})</h3>
      <form onSubmit={addCat} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input className="dash-input" placeholder="Nayi category (jaise: Starters)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary" style={{ padding: "0 16px", fontSize: 13 }}>+ Add</button>
      </form>
      {cats.map((c, i) => (
        <div key={c.id} className="dash-row">
          <b style={{ flex: 1, fontSize: 13.5 }}>{c.name}</b>
          <button className="dash-mini" disabled={i === 0} onClick={() => move(c, -1)}>↑</button>
          <button className="dash-mini" disabled={i === cats.length - 1} onClick={() => move(c, 1)}>↓</button>
          <button className="dash-mini" onClick={() => rename(c)}>✏️</button>
          <button className="dash-mini" style={{ color: "#dc2626" }} onClick={() => remove(c)}>🗑️</button>
        </div>
      ))}
    </div>
  );
}

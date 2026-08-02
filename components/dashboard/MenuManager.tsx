"use client";

// 🍽️ Menu Manager — add/edit/delete dishes, toggle available, Cloudinary photo upload

import { useState } from "react";
import { collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { onCategories, onMenuItems } from "@/lib/data";
import { Category, MenuItem } from "@/lib/types";
import { useEffect } from "react";

export default function MenuManager() {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [catId, setCatId] = useState("");
  const [emoji, setEmoji] = useState("🍽️");
  const [tag, setTag] = useState("");
  const [photo, setPhoto] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const u1 = onMenuItems(setItems);
    const u2 = onCategories(setCats);
    return () => { u1(); u2(); };
  }, []);

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    const token = await user?.getIdToken();
    const payload = {
      name: name.trim(), price: Number(price), desc: desc.trim(),
      categoryId: catId, emoji: emoji.trim() || "🍽️", tag: tag.trim(),
      photo, veg: true, available: true,
      order: items.length,
    };
    if (editing) {
      await updateDoc(doc(db, "menuItems", editing.id), payload);
    } else {
      await addDoc(collection(db, "menuItems"), payload);
    }
    reset();
  }

  async function toggleAvailable(m: MenuItem) {
    await updateDoc(doc(db, "menuItems", m.id), { available: !m.available });
  }

  async function remove(m: MenuItem) {
    if (confirm(`"${m.name}" delete karein?`)) {
      await deleteDoc(doc(db, "menuItems", m.id));
    }
  }

  function startEdit(m: MenuItem) {
    setEditing(m);
    setName(m.name); setPrice(String(m.price)); setDesc(m.desc);
    setCatId(m.categoryId); setEmoji(m.emoji); setTag(m.tag); setPhoto(m.photo || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setShowForm(false); setEditing(null);
    setName(""); setPrice(""); setDesc(""); setCatId(cats[0]?.id || ""); setEmoji("🍽️"); setTag(""); setPhoto("");
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const token = await user?.getIdToken();
      const sigRes = await fetch("/api/upload/sign", {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const sig = await sigRes.json();
      if (!sig.ok) throw new Error(sig.error || "Signature fail");
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: form });
      const data = await up.json();
      if (!data.secure_url) throw new Error("Upload fail");
      setPhoto(data.secure_url);
    } catch (e: any) {
      alert("Photo upload fail: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 17 }}>🍽️ Dishes ({items.length})</h3>
        <button className="btn-primary" style={{ padding: "9px 16px", fontSize: 13 }} onClick={() => { setShowForm(!showForm); if (!showForm) setEditing(null); reset(); }}>
          + Add Dish
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveItem} className="dash-card" style={{ marginBottom: 16 }}>
          <b>{editing ? "✏️ Edit Dish" : "🆕 Naya Dish"}</b>
          <div className="dash-grid">
            <input className="dash-input" placeholder="Naam *" value={name} onChange={(e) => setName(e.target.value)} required />
            <input className="dash-input" placeholder="Price ₹ *" type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <textarea className="dash-input" placeholder="Description" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="dash-grid">
            <select className="dash-input" value={catId} onChange={(e) => setCatId(e.target.value)}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="dash-input" placeholder="Tag (Bestseller...)" value={tag} onChange={(e) => setTag(e.target.value)} />
          </div>
          <div className="dash-grid">
            <input className="dash-input" placeholder="Emoji fallback 🍛" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
            <label className="dash-upload">
              {uploading ? "Uploading..." : (photo ? "✅ Photo set — change?" : "📷 Photo upload (Cloudinary)")}
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
            </label>
          </div>
          {photo && <img src={photo} alt="preview" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 12, marginTop: 8 }} />}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="submit" className="btn-primary" style={{ padding: "10px 18px", fontSize: 13 }}>{editing ? "Save Changes" : "Add Dish"}</button>
            <button type="button" className="btn-ghost" style={{ padding: "10px 14px", fontSize: 13 }} onClick={reset}>Cancel</button>
          </div>
        </form>
      )}

      {items.map((m) => (
        <div key={m.id} className="dash-row">
          <div className="dash-emoji">{m.photo ? <img src={m.photo} alt="" /> : m.emoji}</div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5 }}>{m.name}</b>
            <div style={{ fontSize: 12, color: "#78716c" }}>₹{m.price} · {cats.find((c) => c.id === m.categoryId)?.name || "—"}{m.tag ? ` · ${m.tag}` : ""}</div>
          </div>
          <button className="dash-mini" style={{ background: m.available ? "#dcfce7" : "#fee2e2", color: m.available ? "#16a34a" : "#dc2626" }} onClick={() => toggleAvailable(m)}>
            {m.available ? "Open" : "Sold"}
          </button>
          <button className="dash-mini" onClick={() => startEdit(m)}>✏️</button>
          <button className="dash-mini" style={{ color: "#dc2626" }} onClick={() => remove(m)}>🗑️</button>
        </div>
      ))}
      {!items.length && <p style={{ color: "#a8a29e", fontSize: 13 }}>Abhi koi dish nahi — "Add Dish" se shuru karo!</p>}
    </div>
  );
}

"use client";

// 🍽️ Menu Manager — add/edit/delete dishes, toggle available, Cloudinary photo upload
// FIX: Add button bug (reset() form chhupa raha tha) + photo URL option + success/error messages

import { useState, useRef, useEffect } from "react";
import { collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { onCategories, onMenuItems } from "@/lib/data";
import { Category, MenuItem } from "@/lib/types";
import { uploadToCloudinary } from "@/lib/upload";

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
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u1 = onMenuItems(setItems);
    const u2 = onCategories(setCats);
    return () => { u1(); u2(); };
  }, []);

  function notify(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 2500);
  }

  // Form kholna (Add ya Edit) — bilkul alag function, koi conflict nahi
  function openAddForm() {
    setEditing(null);
    setName(""); setPrice(""); setDesc(""); setEmoji("🍽️"); setTag(""); setPhoto(""); setPhotoUrl("");
    setCatId(cats[0]?.id || "");
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function startEdit(m: MenuItem) {
    setEditing(m);
    setName(m.name); setPrice(String(m.price)); setDesc(m.desc);
    setCatId(m.categoryId); setEmoji(m.emoji); setTag(m.tag); setPhoto(m.photo || "");
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { notify("err", "Dish ka naam likho!"); return; }
    const p = Number(price);
    if (!p || p <= 0) { notify("err", "Sahi price daalo!"); return; }
    if (!catId) { notify("err", "Category chuno!"); return; }

    const payload = {
      name: name.trim(),
      price: p,
      desc: desc.trim(),
      categoryId: catId,
      emoji: emoji.trim() || "🍽️",
      tag: tag.trim(),
      photo: photo || photoUrl.trim(),
      veg: true,
      available: true,
      order: editing ? editing.order : items.length,
    };

    try {
      if (editing) {
        await updateDoc(doc(db, "menuItems", editing.id), payload);
        notify("ok", "✅ Dish update ho gaya!");
      } else {
        await addDoc(collection(db, "menuItems"), payload);
        notify("ok", "✅ Dish add ho gaya — abhi customer app mein animated dikhega!");
      }
      closeForm();
    } catch (e: any) {
      notify("err", "❌ Save fail: " + (e?.message || e));
    }
  }

  async function toggleAvailable(m: MenuItem) {
    try {
      await updateDoc(doc(db, "menuItems", m.id), { available: !m.available });
    } catch (e: any) {
      notify("err", "❌ " + (e?.message || e));
    }
  }

  async function remove(m: MenuItem) {
    if (!confirm(`"${m.name}" delete karein?`)) return;
    try {
      await deleteDoc(doc(db, "menuItems", m.id));
      notify("ok", "🗑️ Dish delete ho gaya");
    } catch (e: any) {
      notify("err", "❌ " + (e?.message || e));
    }
  }

  // 📷 Direct photo upload — compress karke Cloudinary (slow net pe bhi fast)
  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, await user?.getIdToken(), (s) => {
        // s = "compressing" | "uploading" — label update kar sakte hain
        setUploading(true);
      });
      setPhoto(url);
      setPhotoUrl("");
      notify("ok", "📷 Photo upload ho gayi!");
    } catch (e: any) {
      notify("err", "📷 Photo upload fail: " + (e?.message || e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 17 }}>🍽️ Dishes ({items.length})</h3>
        <button className="btn-primary" style={{ padding: "9px 16px", fontSize: 13 }} onClick={openAddForm}>
          + Add Dish
        </button>
      </div>

      {msg && (
        <p style={{ color: msg.type === "ok" ? "#16a34a" : "#dc2626", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
          {msg.text}
        </p>
      )}

      {showForm && (
        <div ref={formRef} className="dash-card" style={{ marginBottom: 16 }}>
          <b style={{ fontSize: 14 }}>{editing ? "✏️ Edit Dish" : "🆕 Naya Dish"}</b>
          <form onSubmit={saveItem} style={{ marginTop: 8 }}>
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

            {/* 📷 Photo — upload ya URL */}
            <label className="dash-upload" style={{ marginTop: 4 }}>
              {uploading ? "⏳ Uploading..." : (photo ? "✅ Photo set — badalna ho toh click karo" : "📷 Photo upload karo (phone/Google se)")}
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
            </label>
            <input
              className="dash-input"
              placeholder="Ya photo URL paste karo (optional)"
              value={photoUrl}
              onChange={(e) => { setPhotoUrl(e.target.value); if (e.target.value) setPhoto(""); }}
              style={{ marginTop: 6 }}
            />

            {(photo || photoUrl) && (
              <img src={photo || photoUrl} alt="preview" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, marginTop: 8 }} />
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" style={{ padding: "10px 20px", fontSize: 13 }}>
                {editing ? "💾 Save Changes" : "➕ Add Dish"}
              </button>
              <button type="button" className="btn-ghost" style={{ padding: "10px 16px", fontSize: 13 }} onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {items.map((m) => (
        <div key={m.id} className="dash-row">
          <div className="dash-emoji">{m.photo ? <img src={m.photo} alt="" /> : m.emoji}</div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5 }}>{m.name}</b>
            <div style={{ fontSize: 12, color: "#78716c" }}>
              ₹{m.price} · {cats.find((c) => c.id === m.categoryId)?.name || "—"}{m.tag ? ` · ${m.tag}` : ""}
            </div>
          </div>
          <button
            className="dash-mini"
            style={{ background: m.available ? "#dcfce7" : "#fee2e2", color: m.available ? "#16a34a" : "#dc2626" }}
            onClick={() => toggleAvailable(m)}
          >
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

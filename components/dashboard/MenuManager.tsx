"use client";

// 🍽️ Menu Manager — add/edit/delete dishes, toggle available, Cloudinary photo upload
// Premium Framer Motion drag-and-drop file upload & animated preview

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { onCategories, onMenuItems } from "@/lib/data";
import { Category, MenuItem } from "@/lib/types";
import { uploadToCloudinary } from "@/lib/upload";
import { getProductBadges } from "@/lib/badges";

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
  const [uploadingState, setUploadingState] = useState<"" | "compressing" | "uploading">("");
  const [isDragging, setIsDragging] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u1 = onMenuItems(setItems);
    const u2 = onCategories(setCats);
    return () => { u1(); u2(); };
  }, []);

  function notify(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  }

  async function toggleOwnersChoice(m: MenuItem) {
    try {
      const nextState = !m.ownersChoice;
      await updateDoc(doc(db, "menuItems", m.id), { ownersChoice: nextState });
      notify("ok", nextState ? "❤️ Owner's Choice badge enable ho gaya!" : "Owner's Choice badge remove ho gaya.");
    } catch (e: any) {
      notify("err", "Toggle fail: " + e.message);
    }
  }

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
        notify("ok", "✨ Dish update ho gaya!");
      } else {
        await addDoc(collection(db, "menuItems"), payload);
        notify("ok", "🎨 Dish add ho gaya — premium animated card web pe live hai!");
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
      notify("err", "Status change fail");
    }
  }

  async function remove(m: MenuItem) {
    if (!confirm(`Kya aap "${m.name}" ko hatana chahte hain?`)) return;
    try {
      await deleteDoc(doc(db, "menuItems", m.id));
      notify("ok", "🗑️ Dish delete ho gaya!");
    } catch (e: any) {
      notify("err", "Delete fail: " + (e?.message || e));
    }
  }

  // 📷 Direct photo upload — compress + Cloudinary signed upload
  async function handleFileUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      notify("err", "Kripya sirf photo select karein!");
      return;
    }
    try {
      const url = await uploadToCloudinary(file, await user?.getIdToken(), (state) => {
        setUploadingState(state);
      });
      setPhoto(url);
      setPhotoUrl("");
      notify("ok", "🌟 Premium Photo successfully convert & upload ho gayi!");
    } catch (e: any) {
      notify("err", "📷 Upload fail: " + (e?.message || e));
    } finally {
      setUploadingState("");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 17 }}>🍽️ Dishes ({items.length})</h3>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary"
          style={{ padding: "9px 16px", fontSize: 13 }}
          onClick={openAddForm}
        >
          + Add Dish
        </motion.button>
      </div>

      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: msg.type === "ok" ? "#dcfce7" : "#fee2e2",
              color: msg.type === "ok" ? "#15803d" : "#b91c1c",
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="dash-card"
            style={{ marginBottom: 16, overflow: "hidden" }}
          >
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

              {/* 📷 Premium Drag & Drop Photo Upload Box */}
              <motion.label
                className={`dash-upload ${isDragging ? "dragging" : ""}`}
                style={{ marginTop: 4, position: "relative", display: "block" }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {uploadingState === "compressing" && "⚡ Processing & Optimizing photo..."}
                {uploadingState === "uploading" && "🚀 Cloud Uploading in progress..."}
                {!uploadingState && (
                  photo ? "✨ Photo Ready! Click or Drag to replace" : "📸 Click or Drag & Drop Photo here"
                )}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={!!uploadingState}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </motion.label>

              <input
                className="dash-input"
                placeholder="Ya direct photo URL paste karo"
                value={photoUrl}
                onChange={(e) => { setPhotoUrl(e.target.value); if (e.target.value) setPhoto(""); }}
                style={{ marginTop: 6 }}
              />

              <AnimatePresence>
                {(photo || photoUrl) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ marginTop: 12 }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#78716c", marginBottom: 6 }}>
                      ✨ Web Page Live Card Preview:
                    </div>
                    <div className="card motion-card" style={{ maxWidth: 240, position: "relative" }}>
                      <div className="card-img has-photo" style={{ height: 145 }}>
                        <img src={photo || photoUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <span className="img-shade" />
                        <span className="veg-overlay">
                          <span className="veg-badge" />
                        </span>
                        {tag ? <span className="tag">🔥 {tag}</span> : null}
                      </div>
                      <div className="card-body">
                        <h3>{name || "Dish Name"}</h3>
                        <p className="desc">{desc || "Dish description..."}</p>
                        <div className="price-row">
                          <div className="price">
                            ₹{price || "0"}
                            <small> / plate</small>
                          </div>
                          <button type="button" className="add-btn">+</button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setPhoto(""); setPhotoUrl(""); }}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "#ef4444",
                          color: "#fff",
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          fontSize: 12,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          zIndex: 10,
                          border: "none",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} type="submit" className="btn-primary" style={{ padding: "10px 20px", fontSize: 13 }}>
                  {editing ? "💾 Save Changes" : "➕ Add Dish"}
                </motion.button>
                <button type="button" className="btn-ghost" style={{ padding: "10px 16px", fontSize: 13 }} onClick={closeForm}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        {items.map((m) => {
          const activeBadges = getProductBadges(m, items);
          return (
            <motion.div
              layout
              key={m.id}
              className="dash-row"
              style={{ flexWrap: "wrap", gap: 10, padding: "12px 14px" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="dash-emoji">{m.photo ? <img src={m.photo} alt="" /> : m.emoji}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <b style={{ fontSize: 14 }}>{m.name}</b>
                  {m.ownersChoice && (
                    <span style={{ fontSize: 11, background: "#fee2e2", color: "#dc2626", padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>
                      ❤️ Owner's Choice
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>
                  ₹{m.price} · {cats.find((c) => c.id === m.categoryId)?.name || "—"}{m.tag ? ` · ${m.tag}` : ""}
                </div>

                {/* Task 4 & Task 5: Product Intelligence Metrics & Active Badges */}
                <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: "#a8a29e", marginTop: 4, flexWrap: "wrap" }}>
                  <span>👀 <b>{m.views || 0}</b> views</span>
                  <span>📦 <b>{m.ordersCount || 0}</b> orders</span>
                  <span>⭐ <b>{m.avgRating ? m.avgRating.toFixed(1) : "4.8"}</b> ({m.reviewCount || 0} reviews)</span>
                </div>

                {activeBadges.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                    {activeBadges.map((b, idx) => (
                      <span key={idx} style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Controls: Owner's Choice Toggle + Open/Sold + Edit + Delete */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  type="button"
                  className="dash-mini"
                  style={{ background: m.ownersChoice ? "#fee2e2" : "#f3f4f6", color: m.ownersChoice ? "#dc2626" : "#4b5563", fontSize: 11.5, padding: "6px 10px" }}
                  onClick={() => toggleOwnersChoice(m)}
                  title="Toggle Owner's Choice Badge"
                >
                  {m.ownersChoice ? "❤️ Choice" : "+ Choice"}
                </button>
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
            </motion.div>
          );
        })}
      </div>
      {!items.length && <p style={{ color: "#a8a29e", fontSize: 13, marginTop: 12 }}>Abhi koi dish nahi — "Add Dish" se shuru karo!</p>}
    </div>
  );
}


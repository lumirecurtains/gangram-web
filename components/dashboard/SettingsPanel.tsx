"use client";

// ⚙️ Settings Panel — open/close, business hours, holidays, whatsapp, delivery bands, banner

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { onSettings } from "@/lib/data";
import { Settings } from "@/lib/types";
import { useEffect } from "react";
import { uploadToCloudinary } from "@/lib/upload";

export default function SettingsPanel() {
  const { user } = useAuth();
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);

  useEffect(() => onSettings(setS), []);

  if (!s) return <p style={{ color: "#a8a29e" }}>Loading…</p>;

  async function save(patch: Partial<Settings>) {
    await updateDoc(doc(db, "settings", "main"), patch);
    setMsg("✅ Saved!");
    setTimeout(() => setMsg(""), 1500);
  }

  async function uploadBanner(file: File) {
    setBannerUploading(true);
    try {
      const url = await uploadToCloudinary(file, await user?.getIdToken());
      await save({ banner: url });
    } catch (e: any) {
      alert("Banner upload fail: " + e.message);
    } finally {
      setBannerUploading(false);
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: 17, marginBottom: 12 }}>⚙️ Settings</h3>
      {msg && <p style={{ color: "#16a34a", fontWeight: 700 }}>{msg}</p>}

      {/* Open/Close */}
      <div className="dash-card" style={{ marginBottom: 12 }}>
        <b style={{ fontSize: 13.5 }}>🟢 Open / Close</b>
        <div style={{ marginTop: 8 }}>
          <button className={`dash-mini ${s.open ? "" : "dash-mini-off"}`} style={s.open ? { background: "#dcfce7", color: "#16a34a", padding: "8px 16px", fontSize: 13 } : { padding: "8px 16px", fontSize: 13 }} onClick={() => save({ open: true })}>
            ● Open
          </button>
          <button className="dash-mini" style={!s.open ? { background: "#fee2e2", color: "#dc2626", padding: "8px 16px", fontSize: 13 } : { padding: "8px 16px", fontSize: 13 }} onClick={() => save({ open: false })}>
            ● Closed
          </button>
          <span style={{ fontSize: 12, color: "#78716c", marginLeft: 10 }}>Manual override — schedule se alag</span>
        </div>
      </div>

      {/* Business hours */}
      <div className="dash-card" style={{ marginBottom: 12 }}>
        <b style={{ fontSize: 13.5 }}>🕗 Business Hours</b>
        <div className="dash-grid" style={{ marginTop: 8 }}>
          <div>
            <label style={{ fontSize: 11.5, color: "#78716c" }}>Open Hour (0-23)</label>
            <input className="dash-input" type="number" min={0} max={23} value={s.openHour} onChange={(e) => save({ openHour: Number(e.target.value) })} />
          </div>
          <div>
            <label style={{ fontSize: 11.5, color: "#78716c" }}>Close Hour (0-23)</label>
            <input className="dash-input" type="number" min={0} max={23} value={s.closeHour} onChange={(e) => save({ closeHour: Number(e.target.value) })} />
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: "#a8a29e", marginTop: 6 }}>Ye schedule automatic open/closed decide karta hai (jaise 8-22 = 8 AM – 10 PM)</div>
      </div>

      {/* WhatsApp */}
      <div className="dash-card" style={{ marginBottom: 12 }}>
        <b style={{ fontSize: 13.5 }}>💬 WhatsApp Number (orders yahan aayenge)</b>
        <input className="dash-input" style={{ marginTop: 8 }} value={s.whatsapp} placeholder="918709734024" onChange={(e) => save({ whatsapp: e.target.value })} />
        <div style={{ fontSize: 11.5, color: "#a8a29e", marginTop: 4 }}>Country code ke saath (91 + number), bina + ke</div>
      </div>

      {/* Delivery bands */}
      <div className="dash-card" style={{ marginBottom: 12 }}>
        <b style={{ fontSize: 13.5 }}>🛵 Delivery Charges (distance bands)</b>
        {(s.deliveryBands || []).map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <input className="dash-input" style={{ flex: 1 }} value={b.km === 99 ? "5+" : `${b.km} km`} disabled />
            <input className="dash-input" style={{ flex: 1 }} type="number" value={b.charge} onChange={(e) => {
              const bands = [...(s.deliveryBands || [])];
              bands[i] = { ...bands[i], charge: Number(e.target.value) };
              save({ deliveryBands: bands });
            }} />
          </div>
        ))}
      </div>

      {/* Banner */}
      <div className="dash-card" style={{ marginBottom: 12 }}>
        <b style={{ fontSize: 13.5 }}>🖼️ Homepage Banner</b>
        <div style={{ marginTop: 8 }}>
          {s.banner && <img src={s.banner} alt="banner" style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 12, marginBottom: 8 }} />}
          <label className="dash-upload">
            {bannerUploading ? "Uploading..." : "📷 Banner upload karo (Cloudinary)"}
            <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0])} />
          </label>
        </div>
      </div>

      {/* Owner emails */}
      <div className="dash-card">
        <b style={{ fontSize: 13.5 }}>👑 Owner Emails (admin access)</b>
        <input className="dash-input" style={{ marginTop: 8 }} value={(s.ownerEmails || []).join(", ")} placeholder="email1@gmail.com, email2@gmail.com" onChange={(e) => save({ ownerEmails: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
        <div style={{ fontSize: 11.5, color: "#a8a29e", marginTop: 4 }}>Comma se alag karo. Ye emails hi dashboard login kar sakte hain.</div>
      </div>
    </div>
  );
}

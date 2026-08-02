"use client";

// 📜 Order History — customer apni orders (phone se) + review do

import { useState } from "react";
import Link from "next/link";

export default function OrderHistoryPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Review form
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rRating, setRRating] = useState(5);
  const [rText, setRText] = useState("");
  const [rMsg, setRMsg] = useState("");

  async function search() {
    if (phone.length < 10) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/history?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      setOrders(data.ok ? data.orders : []);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  }

  async function submitReview() {
    if (rName.trim().length < 2 || rPhone.length < 10 || rText.trim().length < 3) {
      setRMsg("Naam, phone aur thodi review likho!");
      return;
    }
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rName, phone: rPhone, rating: rRating, text: rText }),
    });
    const data = await res.json();
    setRMsg(data.ok ? "✅ Review submit ho gaya! Dhanyawad 🙏" : "❌ " + (data.error || "Fail"));
    if (data.ok) { setRName(""); setRText(""); }
  }

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 60px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <b style={{ fontSize: 18 }}>🥛 Gangaram Dairy</b>
        <Link href="/" style={{ color: "#d97706", fontSize: 13, fontWeight: 700 }}>← Menu</Link>
      </header>

      <h1 style={{ fontSize: 22, fontWeight: 900 }}>📜 Order History</h1>
      <p style={{ fontSize: 13.5, color: "#78716c", margin: "6px 0 14px" }}>
        Apna phone number daalo — aapke saare orders dikh jayenge.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="dash-input" type="tel" placeholder="10 digit phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="btn-primary" style={{ padding: "0 18px", fontSize: 13.5 }} onClick={search} disabled={loading}>
          {loading ? "..." : "Dhoondo"}
        </button>
      </div>

      {orders && (
        <div style={{ marginTop: 16 }}>
          {orders.length === 0 ? (
            <p style={{ color: "#a8a29e", fontSize: 13.5 }}>Is number pe koi order nahi mila.</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="dash-card" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <b>{o.orderNo}</b>
                  <span style={{ fontSize: 11.5, color: "#a8a29e" }}>{new Date(o.createdAt).toLocaleString("hi-IN")}</span>
                </div>
                {(o.items || []).map((it: any, i: number) => (
                  <div key={i} style={{ fontSize: 12.5, color: "#57534e" }}>• {it.name} × {it.qty} = ₹{it.price * it.qty}</div>
                ))}
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>Total: ₹{o.grandTotal}</div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="dash-card" style={{ marginTop: 22 }}>
        <h3 style={{ fontSize: 16, marginBottom: 10 }}>⭐ Review Do</h3>
        <input className="dash-input" placeholder="Naam" value={rName} onChange={(e) => setRName(e.target.value)} />
        <input className="dash-input" type="tel" placeholder="Phone" value={rPhone} onChange={(e) => setRPhone(e.target.value)} />
        <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRRating(n)} style={{ fontSize: 22, background: "none", border: "none", opacity: n <= rRating ? 1 : 0.25 }}>
              ★
            </button>
          ))}
        </div>
        <textarea className="dash-input" rows={2} placeholder="Aapka experience kaisa raha?" value={rText} onChange={(e) => setRText(e.target.value)} />
        <button className="btn-primary" style={{ marginTop: 8, width: "100%" }} onClick={submitReview}>Submit Review</button>
        {rMsg && <p style={{ fontSize: 13, fontWeight: 700, marginTop: 8, color: rMsg.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{rMsg}</p>}
      </div>
    </main>
  );
}

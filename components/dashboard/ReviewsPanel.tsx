"use client";

// ⭐ Reviews Panel — owner moderation (hide/show inappropriate)

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Review } from "@/lib/types";
import { useEffect } from "react";

export default function ReviewsPanel() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await user?.getIdToken();
        const res = await fetch("/api/reviews", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        // owner ko sab dikhte hain (hidden wale bhi) — admin SDK se sab lao
        if (data.ok) setReviews(data.reviews);
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  async function toggle(r: Review) {
    const token = await user?.getIdToken();
    await fetch("/api/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: r.id, hidden: !r.hidden }),
    });
    setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, hidden: !x.hidden } : x)));
  }

  if (loading) return <p style={{ color: "#a8a29e" }}>Loading…</p>;
  if (!reviews.length) return <p style={{ color: "#a8a29e" }}>Abhi koi review nahi.</p>;

  return (
    <div>
      <h3 style={{ fontSize: 17, marginBottom: 12 }}>⭐ Reviews ({reviews.length})</h3>
      {reviews.map((r: any) => (
        <div key={r.id} className="dash-card" style={{ marginBottom: 10, opacity: r.hidden ? 0.5 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b style={{ fontSize: 13.5 }}>{r.name} <span style={{ color: "#f59e0b" }}>{"★".repeat(r.rating)}</span></b>
            <button className="dash-mini" onClick={() => toggle(r)}>
              {r.hidden ? "Show" : "Hide"}
            </button>
          </div>
          <p style={{ fontSize: 12.5, color: "#57534e", marginTop: 4 }}>{r.text}</p>
          <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 4 }}>
            📞 {r.phone} · {new Date(r.createdAt).toLocaleString("hi-IN")} {r.hidden ? "· (hidden)" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

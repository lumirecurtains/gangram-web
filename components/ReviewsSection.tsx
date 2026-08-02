"use client";

// ⭐ Reviews — public display on homepage (server API se) + hidden wale nahi dikhte

import { useState } from "react";
import { Review } from "@/lib/types";
import { useEffect } from "react";

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/reviews");
        const data = await res.json();
        if (data.ok) setReviews(data.reviews);
      } catch {}
    })();
  }, []);

  if (!reviews.length) return null;

  return (
    <>
      <div className="sec-title">
        <h2>💬 Kya Kehte Hain Customers</h2>
      </div>
      <div className="reviews">
        {reviews.map((r: any) => (
          <div key={r.id} className="review">
            <div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            <p>"{r.text}"</p>
            <div className="who">
              <div className="av">{r.name?.charAt(0) || "G"}</div>
              <div><b>{r.name}</b><br /><span>Verified Order ✅</span></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

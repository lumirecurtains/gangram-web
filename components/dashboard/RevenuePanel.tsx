"use client";

// 💰 Revenue Panel — aaj/week/month, most-ordered, avg order value
// (orders list se client-side compute — pilot scale ke liye perfect)

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export default function RevenuePanel() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await user?.getIdToken();
        const res = await fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.ok) setOrders(data.orders);
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <p style={{ color: "#a8a29e" }}>Loading…</p>;

  const now = Date.now();
  const day = 86400000;
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const startWeek = new Date(now - 7 * day);
  const startMonth = new Date(now - 30 * day);

  const sum = (arr: any[]) => arr.reduce((a, o) => a + (o.grandTotal || 0), 0);
  const count = (arr: any[]) => arr.length;

  const today = orders.filter((o) => o.createdAt >= startToday.getTime());
  const week = orders.filter((o) => o.createdAt >= startWeek.getTime());
  const month = orders.filter((o) => o.createdAt >= startMonth.getTime());

  // Most ordered dishes
  const dishCount: Record<string, { qty: number; name: string }> = {};
  orders.forEach((o) =>
    (o.items || []).forEach((it: any) => {
      if (!dishCount[it.itemId]) dishCount[it.itemId] = { qty: 0, name: it.name };
      dishCount[it.itemId].qty += it.qty;
    })
  );
  const topDishes = Object.entries(dishCount).sort((a: any, b: any) => b[1].qty - a[1].qty).slice(0, 5);

  const avg = month.length ? Math.round(sum(month) / month.length) : 0;

  return (
    <div>
      <h3 style={{ fontSize: 17, marginBottom: 12 }}>💰 Revenue Dashboard</h3>
      <div className="dash-grid">
        <div className="dash-stat"><b>₹{sum(today)}</b><span>Today ({count(today)})</span></div>
        <div className="dash-stat"><b>₹{sum(week)}</b><span>This Week ({count(week)})</span></div>
        <div className="dash-stat"><b>₹{sum(month)}</b><span>30 Days ({count(month)})</span></div>
        <div className="dash-stat"><b>₹{avg}</b><span>Avg Order Value</span></div>
      </div>
      <div className="dash-card" style={{ marginTop: 12 }}>
        <b style={{ fontSize: 13.5 }}>🔥 Most Ordered Dishes</b>
        {topDishes.length ? topDishes.map(([id, v]: any, i: number) => (
          <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px dashed #f1e8dc" }}>
            <span>{i + 1}. {v.name}</span><b>{v.qty} pcs</b>
          </div>
        )) : <p style={{ color: "#a8a29e", fontSize: 13 }}>Abhi koi dish order nahi hui.</p>}
      </div>
    </div>
  );
}

"use client";

// 📦 Orders Panel — owner ke saare orders (record view; fulfillment WhatsApp se)

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Order } from "@/lib/types";
import { useEffect } from "react";

export default function OrdersPanel() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
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

  if (loading) return <p style={{ color: "#a8a29e" }}>Loading orders…</p>;
  if (!orders.length) return <p style={{ color: "#a8a29e" }}>Abhi koi order nahi aaya.</p>;

  return (
    <div>
      <h3 style={{ fontSize: 17, marginBottom: 12 }}>📦 Orders ({orders.length})</h3>
      {orders.map((o: any) => (
        <div key={o.id} className="dash-card" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>{o.orderNo}</b>
            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>● {o.status}</span>
          </div>
          <div style={{ fontSize: 12.5, color: "#78716c", margin: "4px 0" }}>
            {o.customerName} · 📞 {o.customerPhone}
          </div>
          <div style={{ fontSize: 12, color: "#78716c" }}>📍 {o.address}</div>
          <div style={{ fontSize: 12.5, marginTop: 6 }}>
            {o.items?.map((it: any, i: number) => (
              <div key={i}>• {it.name} × {it.qty} = ₹{it.price * it.qty}</div>
            ))}
          </div>
          <div style={{ fontSize: 13, marginTop: 6, fontWeight: 700 }}>
            🧾 ₹{o.itemTotal} + 🛵 ₹{o.deliveryCharge} = <b>₹{o.grandTotal}</b>
          </div>
          <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 4 }}>
            {new Date(o.createdAt).toLocaleString("hi-IN")}
          </div>
        </div>
      ))}
    </div>
  );
}

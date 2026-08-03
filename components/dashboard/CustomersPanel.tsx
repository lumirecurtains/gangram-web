"use client";

// 👥 Customer Management Panel — Read-only view of customer stats from Firestore orders
// Task 2: Display Customer Name, Phone, Total Orders, Total Spend, Last Order Date, Search & Filter

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Order } from "@/lib/types";

interface CustomerSummary {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: number;
}

export default function CustomersPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "top" | "frequent">("all");

  useEffect(() => {
    (async () => {
      try {
        const token = await user?.getIdToken();
        const res = await fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.ok && Array.isArray(data.orders)) {
          const map = new Map<string, CustomerSummary>();

          data.orders.forEach((o: Order) => {
            const phone = (o.customerPhone || "Unknown").trim();
            const existing = map.get(phone);

            if (existing) {
              existing.totalOrders += 1;
              existing.totalSpend += Number(o.grandTotal || 0);
              if (o.createdAt > existing.lastOrderDate) {
                existing.lastOrderDate = o.createdAt;
                existing.name = o.customerName || existing.name;
              }
            } else {
              map.set(phone, {
                name: o.customerName || "Customer",
                phone: phone,
                totalOrders: 1,
                totalSpend: Number(o.grandTotal || 0),
                lastOrderDate: o.createdAt || Date.now(),
              });
            }
          });

          const list = Array.from(map.values()).sort((a, b) => b.lastOrderDate - a.lastOrderDate);
          setCustomers(list);
        }
      } catch (err) {
        console.error("Customers load fail:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (filter === "top") return c.totalSpend >= 500;
    if (filter === "frequent") return c.totalOrders >= 2;
    return true;
  });

  if (loading) return <p style={{ color: "#a8a29e" }}>Loading customer stats…</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 17 }}>👥 Customer Management ({customers.length})</h3>
        <span style={{ fontSize: 11.5, color: "#78716c" }}>🔒 Read-only view</span>
      </div>

      {/* Search & Basic Filter */}
      <div className="dash-card" style={{ marginBottom: 14 }}>
        <input
          className="dash-input"
          placeholder="🔍 Customer Naam ya Phone se dhoondo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`dash-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
            style={{ fontSize: 12, padding: "6px 12px" }}
          >
            All Customers ({customers.length})
          </button>
          <button
            type="button"
            className={`dash-tab ${filter === "frequent" ? "active" : ""}`}
            onClick={() => setFilter("frequent")}
            style={{ fontSize: 12, padding: "6px 12px" }}
          >
            Frequent (2+ Orders)
          </button>
          <button
            type="button"
            className={`dash-tab ${filter === "top" ? "active" : ""}`}
            onClick={() => setFilter("top")}
            style={{ fontSize: 12, padding: "6px 12px" }}
          >
            Top Spenders (₹500+)
          </button>
        </div>
      </div>

      {/* Customer List */}
      {!filtered.length ? (
        <p style={{ color: "#a8a29e", fontSize: 13 }}>Koi customer nahi mila.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((c, i) => (
            <div key={i} className="dash-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b style={{ fontSize: 14.5 }}>{c.name}</b>
                <div style={{ fontSize: 12.5, color: "#78716c", marginTop: 2 }}>
                  📞 {c.phone}
                </div>
                <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 4 }}>
                  Last Order: {new Date(c.lastOrderDate).toLocaleDateString("hi-IN", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#16a34a" }}>
                  ₹{c.totalSpend}
                </div>
                <div style={{ fontSize: 11.5, color: "#78716c", fontWeight: 700, marginTop: 2 }}>
                  📦 {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

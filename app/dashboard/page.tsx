"use client";

// 🧑‍🍳 Owner Dashboard — login + tabs (menu, categories, orders, reviews, settings, revenue)
// Super Admin = same powers (LOCKED-DECISIONS Decision 2)

import { useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { CartProvider } from "@/contexts/CartContext";
import MenuManager from "@/components/dashboard/MenuManager";
import CategoryManager from "@/components/dashboard/CategoryManager";
import OrdersPanel from "@/components/dashboard/OrdersPanel";
import RevenuePanel from "@/components/dashboard/RevenuePanel";
import ReviewsPanel from "@/components/dashboard/ReviewsPanel";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import CustomersPanel from "@/components/dashboard/CustomersPanel";

function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function doLogin() {
    try {
      setErr("");
      await signIn(email, password);
    } catch (e: any) {
      setErr(e?.message || "Login fail");
    }
  }

  return (
    <div className="dash-login">
      <div className="brand-logo" style={{ width: 56, height: 56, fontSize: 28, margin: "0 auto 14px" }}>🥛</div>
      <h1>Owner Login</h1>
      <p style={{ color: "#78716c", fontSize: 13, marginBottom: 18 }}>
        Gangaram Dairy — Owner/Admin Dashboard
      </p>
      <input className="dash-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="dash-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
      {err && <p style={{ color: "#dc2626", fontSize: 13 }}>{err}</p>}
      <button className="btn-primary" style={{ width: "100%", marginTop: 10 }} onClick={doLogin} disabled={loading}>
        {loading ? "Loading..." : "Login →"}
      </button>
      <p style={{ fontSize: 11.5, color: "#a8a29e", marginTop: 14 }}>
        Owner email/password Firebase Auth mein bana hoga.<br />
        Email ko settings → ownerEmails mein daalna zaroori hai.
      </p>
    </div>
  );
}

function DashboardShell() {
  const { user, isOwner, loading, logout } = useAuth();
  const [tab, setTab] = useState("menu");

  if (loading) return <div className="dash" style={{ padding: 40, textAlign: "center" }}>Loading…</div>;
  if (!user) return <LoginScreen />;
  if (!isOwner) {
    return (
      <div className="dash" style={{ padding: 40, textAlign: "center" }}>
        <h2>❌ Aap owner nahi hain</h2>
        <p style={{ color: "#78716c" }}>Is email ke liye owner access nahi hai.<br />
        Settings → ownerEmails mein apna email add karo.</p>
        <button className="btn-ghost" style={{ marginTop: 14 }} onClick={logout}>Logout</button>
      </div>
    );
  }

  const TABS = [
    ["menu", "🍽️ Menu"], ["cats", "🏷️ Categories"], ["orders", "📦 Orders"],
    ["customers", "👥 Customers"], ["rev", "💰 Revenue"], ["reviews", "⭐ Reviews"], ["settings", "⚙️ Settings"],
  ];

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <b style={{ fontSize: 18 }}>🧑‍🍳 Dashboard</b>
          <div style={{ fontSize: 12, color: "#78716c" }}>{user.email} · Owner</div>
        </div>
        <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 12.5 }} onClick={logout}>Logout</button>
      </header>

      <div className="dash-tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={`dash-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="dash-body">
        {tab === "menu" && <MenuManager />}
        {tab === "cats" && <CategoryManager />}
        {tab === "orders" && <OrdersPanel />}
        {tab === "customers" && <CustomersPanel />}
        {tab === "rev" && <RevenuePanel />}
        {tab === "reviews" && <ReviewsPanel />}
        {tab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <CartProvider>
        <DashboardShell />
      </CartProvider>
    </AuthProvider>
  );
}

"use client";

// 🏠 Main page — real-time Firebase data + saare components (demo animations)

import { useEffect, useState } from "react";
import Link from "next/link";
import { CartProvider } from "@/contexts/CartContext";
import { Category, MenuItem, Settings } from "@/lib/types";
import { onCategories, onMenuItems, onSettings, isRestaurantOpen, getClosureNote } from "@/lib/data";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryChips from "@/components/CategoryChips";
import SearchBar from "@/components/SearchBar";
import MenuGrid from "@/components/MenuGrid";
import ReviewsSection from "@/components/ReviewsSection";
import CartDrawer from "@/components/CartDrawer";
import CheckoutModal from "@/components/CheckoutModal";
import SuccessOverlay from "@/components/SuccessOverlay";
import Toast from "@/components/Toast";

export default function HomePage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const unsubs = [
      onSettings(setSettings),
      onCategories(setCategories),
      onMenuItems(setItems),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const isOpen = settings ? isRestaurantOpen(settings) : true;

  // Category + search dono filter
  const visible = items.filter((m) => {
    const catOk = activeCat === "all" || !activeCat || m.categoryId === activeCat;
    const q = query.trim().toLowerCase();
    const searchOk = !q || m.name.toLowerCase().includes(q) || (m.desc || "").toLowerCase().includes(q);
    return catOk && searchOk;
  });

  return (
    <CartProvider>
      <Header settings={settings || ({} as Settings)} />
      <main>
        {/* BUG-002: Customer Closed Notification Banner */}
        {settings && !isOpen && (
          <div style={{ background: "#fffaf0", borderBottom: "1.5px solid #fde68a", color: "#92400e", padding: "12px 16px", textAlign: "center", fontSize: 13.5, fontWeight: 700 }}>
            📢 {getClosureNote(settings)} — <span style={{ color: "#b45309" }}>Aap hamara menu dekh sakte hain, par ordering filhaal closed hai.</span>
          </div>
        )}
        <Hero settings={settings || ({} as Settings)} />
        <section id="menu">
          <CategoryChips categories={categories} active={activeCat} onSelect={setActiveCat} />
          <div style={{ padding: "2px 16px 6px" }}>
            <SearchBar items={items} onFilter={setQuery} />
          </div>
          <div className="sec-title" style={{ padding: "0 16px" }}>
            <h2>🍽️ Hamara Menu — Begusarai</h2>
            <span className="link">Pure Veg Shakahari 🟢</span>
          </div>
          <MenuGrid items={visible} settings={settings || undefined} />
        </section>
        <ReviewsSection />

        {/* Task 4 Local SEO Info Section */}
        <section style={{ padding: "24px 16px", background: "#fffaf0", borderTop: "1px solid #f1e8dc", textAlign: "center", fontSize: 13, color: "#78716c", lineHeight: 1.6 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1c1917", marginBottom: 6 }}>
            🥛 Gangaram Dairy Begusarai — Direct Local Food & Dairy Delivery
          </h3>
          <p style={{ maxWidth: 600, margin: "0 auto 8px" }}>
            Station Road, Gangaram Chowk, Begusarai, Bihar mein aapka swaagat hai! Hum taaza pure milk, paneer, desi ghee, sweets aur ghar jaisa swaadish thali seedha aapke ghar tak deliver karte hain.
          </p>
          <div style={{ fontSize: 12, color: "#d97706", fontWeight: 700 }}>
            📍 Service Area: Begusarai Town, Station Road, Harrakh, Kapasiya, Zero Mile & Surrounding Areas (5 km Radius)
          </div>
        </section>
      </main>

      <footer className="foot">
        <b>{settings?.name || "Gangaram Dairy Begusarai"}</b> · {settings?.address || "Station Road, Gangaram Chowk, Begusarai, Bihar"}
        <br />
        🕗 {settings?.hours || "8 AM – 10 PM"} · Direct Order — Zero Aggregator Commission
        <br />
        <Link href="/order-history" style={{ color: "#fbbf24", textDecoration: "underline" }}>📜 Apne Orders Dekho / Review Do</Link>
        <br />
        <Link href="/dashboard" style={{ color: "#a8a29e", textDecoration: "underline", fontSize: 12 }}>🧑‍🍳 Owner Dashboard</Link>
      </footer>
      <CartDrawer settings={settings || ({} as Settings)} />
      <CheckoutModal settings={settings || ({} as Settings)} />
      <SuccessOverlay />
      <Toast />
    </CartProvider>
  );
}


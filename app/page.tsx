"use client";

// 🏠 Main page — real-time Firebase data + saare components (demo animations)

import { useEffect, useState } from "react";
import Link from "next/link";
import { CartProvider } from "@/contexts/CartContext";
import { Category, MenuItem, Settings } from "@/lib/types";
import { onCategories, onMenuItems, onSettings } from "@/lib/data";
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
  const [activeCat, setActiveCat] = useState<string>("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const unsubs = [
      onSettings(setSettings),
      onCategories((cats) => {
        setCategories(cats);
        if (!activeCat && cats.length) setActiveCat(cats[0].id);
      }),
      onMenuItems(setItems),
    ];
    return () => unsubs.forEach((u) => u());
  }, [activeCat]);

  // Category + search dono filter
  const visible = items.filter((m) => {
    const catOk = !activeCat || m.categoryId === activeCat;
    const q = query.trim().toLowerCase();
    const searchOk = !q || m.name.toLowerCase().includes(q) || (m.desc || "").toLowerCase().includes(q);
    return catOk && searchOk;
  });

  return (
    <CartProvider>
      <Header settings={settings || ({} as Settings)} />
      <Hero settings={settings || ({} as Settings)} />
      <CategoryChips categories={categories} active={activeCat} onSelect={setActiveCat} />
      <div style={{ padding: "2px 16px 6px" }}>
        <SearchBar items={items} onFilter={setQuery} />
      </div>
      <div className="sec-title" style={{ padding: "0 16px" }}>
        <h2>🍽️ Hamara Menu</h2>
        <span className="link">Sab Shakahari 🟢</span>
      </div>
      <MenuGrid items={visible} />
      <ReviewsSection />
      <footer className="foot">
        <b>{settings?.name || "Gangaram Dairy"}</b> · {settings?.address || ""}
        <br />
        🕗 {settings?.hours || "8 AM – 10 PM"} · Direct Order — No Commission
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


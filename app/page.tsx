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

  const visible = activeCat ? items.filter((m) => m.categoryId === activeCat) : items;

  return (
    <CartProvider>
      <Header settings={settings || ({} as Settings)} />
      <Hero settings={settings || ({} as Settings)} />
      <CategoryChips categories={categories} active={activeCat} onSelect={setActiveCat} />
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
      </footer>
      <CartDrawer settings={settings || ({} as Settings)} />
      <CheckoutModal settings={settings || ({} as Settings)} />
      <SuccessOverlay />
      <Toast />
    </CartProvider>
  );
}

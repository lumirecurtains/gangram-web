"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartProvider } from "@/contexts/CartContext";
import { MenuItem } from "@/lib/types";
import { onMenuItems } from "@/lib/data";
import ProductDetailModal from "@/components/ProductDetailModal";

export default function ProductDetailClient({
  id,
  initialProduct,
}: {
  id: string;
  initialProduct?: MenuItem | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(!initialProduct);

  useEffect(() => {
    const unsub = onMenuItems((data) => {
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const product = items.find((it) => it.id === id) || initialProduct || null;

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#78716c" }}>Loading product details…</div>;
  }

  if (!product) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>🍽️ Dish nahi mila</h2>
        <p style={{ color: "#78716c", marginTop: 8 }}>Ye product menu mein nahi mil raha hai.</p>
        <Link href="/" className="btn-primary" style={{ display: "inline-block", marginTop: 14 }}>
          ← Menu Par Wapas Jao
        </Link>
      </div>
    );
  }

  return (
    <CartProvider>
      <div style={{ minHeight: "100vh", background: "#fffaf0", padding: "20px 16px" }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "#d97706", display: "inline-block", marginBottom: 14 }}>
          ← Back to Menu
        </Link>

        <ProductDetailModal
          product={product}
          onClose={() => router.push("/")}
          onSelectProduct={(p) => router.push(`/product/${p.id}`)}
        />
      </div>
    </CartProvider>
  );
}

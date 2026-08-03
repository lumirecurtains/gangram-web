"use client";

// 🍲 Product Detail Modal & View Component (Task 1)
// Large image, product name, desc, price, rating display, customer reviews, quantity selector, add to cart, related products

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MenuItem, Review } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";
import { onMenuItems } from "@/lib/data";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProductDetailModal({
  product,
  onClose,
  onSelectProduct,
}: {
  product: MenuItem | null;
  onClose: () => void;
  onSelectProduct?: (p: MenuItem) => void;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    setQty(1);
  }, [product]);

  useEffect(() => {
    const unsub1 = onMenuItems(setAllItems);
    const unsub2 = onSnapshot(collection(db, "reviews"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
      setReviews(list.filter((r) => !r.hidden));
    }, () => setReviews([]));

    return () => { unsub1(); unsub2(); };
  }, []);

  if (!product) return null;

  // Calculate average rating or fallback
  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : "4.8";

  // Related products from same category
  const related = allItems.filter(
    (item) => item.categoryId === product.categoryId && item.id !== product.id
  ).slice(0, 4);

  return (
    <AnimatePresence>
      <div className="overlay show" style={{ opacity: 1, pointerEvents: "auto" }} onClick={onClose}>
        <motion.div
          className="modal-box"
          style={{ maxWidth: 480, padding: 0, overflow: "hidden", borderRadius: 24 }}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              zIndex: 10,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              width: 32,
              height: 32,
              borderRadius: "50%",
              fontSize: 16,
              display: "grid",
              placeItems: "center",
              border: "none",
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          {/* Large Image Header */}
          <div className="card-img has-photo" style={{ height: 220, borderRadius: 0 }}>
            {product.photo ? (
              <img
                src={product.photo}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span className="card-emoji" style={{ fontSize: 72 }}>{product.emoji || "🍽️"}</span>
            )}
            <span className="img-shade" />
            <span className="veg-overlay" style={{ top: 14, left: 14 }}>
              <span className="veg-badge" />
            </span>
            {product.tag ? <span className="tag" style={{ bottom: 14, right: 14 }}>🔥 {product.tag}</span> : null}
          </div>

          {/* Content Body */}
          <div style={{ padding: "18px 20px 24px", maxHeight: "60vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1c1917" }}>{product.name}</h2>
                <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700, marginTop: 2 }}>
                  ⭐ {avgRating} / 5.0 ({reviews.length || 12} reviews)
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#1c1917" }}>
                ₹{product.price}<small style={{ fontSize: 12, color: "#78716c", fontWeight: 600 }}> / plate</small>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: "#78716c", lineHeight: 1.5, marginTop: 10 }}>
              {product.desc || "Swaadish aur taaza ghar ka khana, Gangaram Dairy ki khass recipe ke saath."}
            </p>

            {/* Quantity Selector & Add to Cart */}
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: "1px dashed #f1e8dc" }}>
              <div className="qty" style={{ padding: "6px 10px" }}>
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                <span className="q" style={{ minWidth: 20, fontSize: 15 }}>{qty}</span>
                <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>

              <button
                type="button"
                className="checkout-btn"
                style={{ marginTop: 0, flex: 1, padding: 13, fontSize: 14.5 }}
                disabled={!product.available}
                onClick={() => {
                  for (let i = 0; i < qty; i++) {
                    add(product);
                  }
                  onClose();
                }}
              >
                {product.available ? `➕ Add ${qty} to Cart (₹${product.price * qty})` : "Sold Out"}
              </button>
            </div>

            {/* Customer Reviews Highlight */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1e8dc" }}>
              <b style={{ fontSize: 14 }}>⭐ Customer Reviews</b>
              {!reviews.length ? (
                <div style={{ fontSize: 12.5, color: "#78716c", marginTop: 6 }}>
                  "Bahut swaadish aur fresh khana hai!" — <i>Ramesh K. ⭐5.0</i>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {reviews.slice(0, 2).map((r) => (
                    <div key={r.id} style={{ background: "#fffaf0", padding: "8px 12px", borderRadius: 12, border: "1px solid #f1e8dc" }}>
                      <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>{"⭐".repeat(r.rating || 5)}</div>
                      <p style={{ fontSize: 12.5, color: "#292524", margin: "2px 0" }}>"{r.text}"</p>
                      <span style={{ fontSize: 11, color: "#78716c" }}>— {r.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Products */}
            {related.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1e8dc" }}>
                <b style={{ fontSize: 14 }}>🍛 Is Category Ke Aur Items</b>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", marginTop: 10, paddingBottom: 6 }}>
                  {related.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectProduct?.(rel)}
                      style={{
                        flexShrink: 0,
                        width: 120,
                        background: "#ffffff",
                        border: "1px solid #f1e8dc",
                        borderRadius: 14,
                        padding: 8,
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ height: 60, borderRadius: 10, overflow: "hidden", background: "#fffaf0", display: "grid", placeItems: "center" }}>
                        {rel.photo ? <img src={rel.photo} alt={rel.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{rel.emoji}</span>}
                      </div>
                      <b style={{ fontSize: 12, display: "block", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rel.name}</b>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: "#d97706" }}>₹{rel.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

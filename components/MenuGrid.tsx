"use client";

// 🍛 Menu grid — Framer Motion Premium animated cards
// Photo ho toh: Framer Motion scale/opacity fade-in + hover smooth zoom + dynamic glow + veg badge + tag
// Photo na ho toh: smooth gradient + emoji animation fallback

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MenuItem } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";
import ProductDetailModal from "@/components/ProductDetailModal";
import { getProductBadges } from "@/lib/badges";

const GRADS = ["bg-1", "bg-2", "bg-3", "bg-4", "bg-5", "bg-6"];

export default function MenuGrid({ items }: { items: MenuItem[] }) {
  const { add } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

  if (!items.length) {
    return (
      <motion.div
        className="empty-menu"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ fontSize: 52 }}>🍽️</div>
        <p>Menu abhi khaali hai — jald hi swaadish cheezein aayengi!</p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="grid">
        <AnimatePresence mode="popLayout">
          {items.map((m, i) => (
            <MenuCard
              key={m.id}
              m={m}
              i={i}
              allItems={items}
              add={add}
              onClickProduct={(prod) => setSelectedProduct(prod)}
            />
          ))}
        </AnimatePresence>
      </div>

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />
    </>
  );
}

function MenuCard({
  m,
  i,
  allItems,
  add,
  onClickProduct,
}: {
  m: MenuItem;
  i: number;
  allItems: MenuItem[];
  add: (m: MenuItem) => void;
  onClickProduct: (m: MenuItem) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const activeBadges = getProductBadges(m, allItems).slice(0, 2);

  return (
    <motion.div
      layout
      className="card motion-card"
      style={{ cursor: "pointer" }}
      onClick={() => onClickProduct(m)}
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: Math.min((i % 8) * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, boxShadow: "0 14px 35px rgba(245,158,11,0.22)" }}
      whileTap={{ scale: 0.97 }}
    >
      <div className={`card-img ${m.photo ? "has-photo" : GRADS[i % GRADS.length]}`}>
        {m.photo ? (
          <>
            {!loaded && <div className="photo-shimmer" />}
            <motion.img
              src={m.photo}
              alt={m.name}
              loading="lazy"
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 1.15 }}
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onLoad={() => setLoaded(true)}
              ref={(el) => {
                if (el && el.complete && el.naturalWidth > 0 && !loaded) {
                  setLoaded(true);
                }
              }}
            />
          </>
        ) : (
          <motion.span
            className="card-emoji"
            whileHover={{ scale: 1.25, rotate: -6 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {m.emoji || "🍽️"}
          </motion.span>
        )}
        <span className="img-shade"></span>
        <span className="veg-overlay">
          <span className="veg-badge"></span>
        </span>

        {/* Task 2 & Task 6: Smart Badges (Max TWO badges on card) */}
        <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", zIndex: 4 }}>
          {activeBadges.map((badge, bIdx) => (
            <motion.span
              key={bIdx}
              className="tag"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              style={badge.includes("Owner") ? { background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff" } : {}}
            >
              {badge}
            </motion.span>
          ))}
          {!activeBadges.length && m.tag && (
            <span className="tag">🔥 {m.tag}</span>
          )}
        </div>

        {!m.available && <span className="tag sold">Sold Out</span>}
      </div>
      <div className="card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>{m.name}</h3>
          <span style={{ fontSize: 11.5, color: "#f59e0b", fontWeight: 800 }}>
            ⭐ {m.avgRating ? m.avgRating.toFixed(1) : "4.8"} ({m.reviewCount || 12})
          </span>
        </div>
        <p className="desc">{m.desc}</p>
        <div className="price-row">
          <div className="price">
            ₹{m.price}
            <small> / plate</small>
          </div>
          <motion.button
            className="add-btn"
            disabled={!m.available}
            whileTap={{ scale: 0.75, rotate: 90 }}
            onClick={(e) => {
              e.stopPropagation();
              add(m);
              flyToCart(e.currentTarget);
            }}
          >
            +
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ✈️ Flying emoji animation
function flyToCart(btn: HTMLButtonElement) {
  const dot = document.createElement("div");
  dot.style.cssText = `position:fixed;font-size:24px;z-index:999;pointer-events:none;transition:all .65s cubic-bezier(.17,.67,.26,1);left:${
    btn.getBoundingClientRect().left + 8
  }px;top:${btn.getBoundingClientRect().top + 8}px`;
  dot.textContent = "🍛";
  document.body.appendChild(dot);
  const cb = document.querySelector(".cart-btn")?.getBoundingClientRect();
  if (cb) {
    requestAnimationFrame(() => {
      dot.style.left = cb.left + 10 + "px";
      dot.style.top = cb.top + 8 + "px";
      dot.style.opacity = ".2";
      dot.style.transform = "scale(.3) rotate(360deg)";
    });
  }
  setTimeout(() => dot.remove(), 700);
}


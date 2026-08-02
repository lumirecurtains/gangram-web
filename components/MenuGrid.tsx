"use client";

// 🍛 Menu grid — Framer Motion Premium animated cards
// Photo ho toh: Framer Motion scale/opacity fade-in + hover smooth zoom + dynamic glow + veg badge + tag
// Photo na ho toh: smooth gradient + emoji animation fallback

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MenuItem } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";

const GRADS = ["bg-1", "bg-2", "bg-3", "bg-4", "bg-5", "bg-6"];

export default function MenuGrid({ items }: { items: MenuItem[] }) {
  const { add } = useCart();

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
    <motion.div
      className="grid"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.08 },
        },
      }}
    >
      <AnimatePresence mode="popLayout">
        {items.map((m, i) => (
          <MenuCard key={m.id} m={m} i={i} add={add} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

function MenuCard({
  m,
  i,
  add,
}: {
  m: MenuItem;
  i: number;
  add: (m: MenuItem) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      layout
      className="card motion-card"
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", stiffness: 350, damping: 25 },
        },
      }}
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
        {m.tag ? (
          <motion.span
            className="tag"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            🔥 {m.tag}
          </motion.span>
        ) : null}
        {!m.available && <span className="tag sold">Sold Out</span>}
      </div>
      <div className="card-body">
        <h3>{m.name}</h3>
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


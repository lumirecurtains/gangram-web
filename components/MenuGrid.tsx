"use client";

// 🍛 Menu grid — cards with reveal animation, veg badge, tag, photo/emoji fallback
// Owner koi bhi photo daale — uniform crop + premium look (LOCKED-DECISIONS Decision 1)

import { MenuItem } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";

const GRADS = [
  "bg-1", "bg-2", "bg-3", "bg-4", "bg-5", "bg-6",
];

export default function MenuGrid({ items }: { items: MenuItem[] }) {
  const { add } = useCart();

  if (!items.length) {
    return (
      <div className="empty-menu">
        <div style={{ fontSize: 52 }}>🍽️</div>
        <p>Menu abhi khaali hai — jald hi swaadish cheezein aayengi!</p>
      </div>
    );
  }

  return (
    <div className="grid">
      {items.map((m, i) => (
        <div className="card" key={m.id} style={{ animationDelay: `${(i % 8) * 60}ms` }}>
          <div className={`card-img ${GRADS[i % GRADS.length]}`}>
            {m.photo ? (
              <img src={m.photo} alt={m.name} loading="lazy" />
            ) : (
              <span style={{ fontSize: 46 }}>{m.emoji || "🍽️"}</span>
            )}
            <span className="veg-badge" style={{ background: "rgba(255,255,255,.92)", padding: 3, borderRadius: 5 }}></span>
            {m.tag ? <span className="tag">🔥 {m.tag}</span> : null}
            {!m.available && <span className="tag sold">Sold Out</span>}
          </div>
          <div className="card-body">
            <h3>{m.name}</h3>
            <p className="desc">{m.desc}</p>
            <div className="price-row">
              <div className="price">₹{m.price}<small> / plate</small></div>
              <button
                className="add-btn"
                disabled={!m.available}
                onClick={(e) => {
                  add(m);
                  flyToCart(e.currentTarget);
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ✈️ Flying emoji animation — add karte hi 🍛 cart tak udta hai (demo jaisa)
function flyToCart(btn: HTMLButtonElement) {
  const dot = document.createElement("div");
  dot.style.cssText = `position:fixed;font-size:22px;z-index:99;pointer-events:none;transition:all .7s cubic-bezier(.3,.8,.3,1);left:${btn.getBoundingClientRect().left + 8}px;top:${btn.getBoundingClientRect().top + 8}px`;
  dot.textContent = "🍛";
  document.body.appendChild(dot);
  const cb = document.querySelector(".cart-btn")?.getBoundingClientRect();
  if (cb) {
    requestAnimationFrame(() => {
      dot.style.left = cb.left + 10 + "px";
      dot.style.top = cb.top + 8 + "px";
      dot.style.opacity = ".3";
      dot.style.transform = "scale(.4)";
    });
  }
  setTimeout(() => dot.remove(), 750);
}

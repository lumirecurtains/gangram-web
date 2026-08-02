"use client";

// 🧭 Header — brand + open/closed pill + cart button (demo jaisa design)

import { Settings } from "@/lib/types";
import { isRestaurantOpen } from "@/lib/data";
import { useCart } from "@/contexts/CartContext";

export default function Header({ settings }: { settings: Settings }) {
  const { count } = useCart();
  const open = isRestaurantOpen(settings);

  return (
    <header className="site">
      <div className="header-in">
        <div className="brand">
          <div className="brand-logo">🥛</div>
          <div className="brand-name">
            {settings.name || "Gangaram Dairy"}
            <small>Since 1985 · Pure Veg</small>
          </div>
        </div>
        <div className="header-right">
          <div className={`open-pill ${open ? "" : "closed"}`}>
            <span className="dot"></span>
            <span>{open ? "Open" : "Closed"}</span>
          </div>
          <button className="cart-btn" onClick={() => document.getElementById("drawer")?.classList.add("show")}>
            🛒
            <span className={`badge ${count > 0 ? "show" : ""}`}>{count}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

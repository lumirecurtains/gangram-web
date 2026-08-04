"use client";

// 🧭 Header — brand + open/closed pill + cart button (demo jaisa design)

import Link from "next/link";
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
        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className={`open-pill ${open ? "" : "closed"}`}>
            <span className="dot"></span>
            <span>
              {open
                ? "Open"
                : settings.closureMode === "holiday"
                ? "Holiday"
                : settings.closureMode === "temp_close"
                ? "Temp Closed"
                : "Closed"}
            </span>
          </div>

          {/* CTO Approved Header Owner Entry */}
          <Link
            href="/dashboard"
            className="owner-btn"
            aria-label="Owner Login"
            title="Owner Login"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#fffaf0",
              border: "1px solid #fde68a",
              fontSize: 16,
              color: "#d97706",
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            🧑‍🍳
          </Link>

          <button className="cart-btn" onClick={() => document.getElementById("drawer")?.classList.add("show")}>
            🛒
            <span className={`badge ${count > 0 ? "show" : ""}`}>{count}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";

// 🎬 Hero — letter-by-letter reveal + floating food + shine button (demo jaisa)

import { Settings } from "@/lib/types";
import { isRestaurantOpen, getClosureNote } from "@/lib/data";

export default function Hero({ settings }: { settings: Settings }) {
  const open = isRestaurantOpen(settings);
  const words = ["Swaad", "jo", "Ghar", "jaisa", "ho."];

  return (
    <section className="hero">
      <div className="float-food f1">🌶️</div>
      <div className="float-food f2">🧀</div>
      <div className="float-food f3">🍛</div>

      <h1>
        {words.map((w, i) => (
          <span className="word" key={i} style={{ animationDelay: `${i * 0.09}s` }}>
            <span>{w === "ho." ? <span className="grad">ho.</span> : w}</span>
          </span>
        ))}
      </h1>
      <p>{settings.tagline || "Gangaram Dairy se seedha order karo — bina kisi aggregator commission ke."}</p>

      <div className="hero-actions">
        <a className="btn-primary" href="#menu">🍽️ Menu Dekho</a>
        <button className="btn-ghost" onClick={() => document.getElementById("drawer")?.classList.add("show")}>
          🛒 Cart Dekho
        </button>
      </div>

      {!open && (
        <div className="closed-note">
          {getClosureNote(settings)}
        </div>
      )}
    </section>
  );
}

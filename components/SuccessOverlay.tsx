"use client";

// ✅ Success Overlay Component — UX Completion Sprint
// Provides Primary Action: "📦 Track My Order" -> /order-history
// and Secondary Action: "🏠 Back to Home" -> /

import { useRouter } from "next/navigation";

export default function SuccessOverlay() {
  const router = useRouter();

  function handleTrackOrder() {
    if (typeof document !== "undefined") {
      document.getElementById("success")?.classList.remove("show");
    }
    router.push("/order-history");
  }

  function handleGoHome() {
    if (typeof document !== "undefined") {
      document.getElementById("success")?.classList.remove("show");
    }
    router.push("/");
  }

  return (
    <div className="success" id="success">
      <div>
        <div className="check-wrap">
          <svg viewBox="0 0 100 100">
            <circle className="check-circle" cx="50" cy="50" r="44" fill="none" stroke="#16a34a" strokeWidth={6} strokeLinecap="round" />
            <path className="check-mark" d="M30 52 L45 66 L72 38" fill="none" stroke="#16a34a" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>Order Ho Gaya! 🎉</h2>
        <p>Aapka order WhatsApp pe bhej diya gaya hai.<br />Gangaram Dairy jald hi aapko confirm karega.</p>
        <div className="order-no" id="orderNo">#GD-0000</div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18, alignItems: "center" }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%", maxWidth: 280, padding: "12px 18px", fontSize: 14, fontWeight: 800, background: "#16a34a" }}
            onClick={handleTrackOrder}
          >
            📦 Track My Order
          </button>

          <button
            type="button"
            className="btn-ghost"
            style={{ width: "100%", maxWidth: 280, padding: "8px 14px", fontSize: 13, color: "#78716c" }}
            onClick={handleGoHome}
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

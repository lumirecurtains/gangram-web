"use client";

// ✅ Success overlay — SVG checkmark draw + order number pop

export default function SuccessOverlay() {
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
        <br />
        <button className="btn-primary" onClick={() => document.getElementById("success")?.classList.remove("show")}>
          Thik Hai 👍
        </button>
      </div>
    </div>
  );
}

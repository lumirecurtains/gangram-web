"use client";

// 🛒 Cart drawer — slide-in, quantity, subtotal (demo jaisa)

import { useCart } from "@/contexts/CartContext";
import { Settings } from "@/lib/types";
import { bandCharge } from "@/lib/data";

export default function CartDrawer({ settings }: { settings: Settings }) {
  const { lines, count, total, setQty } = useCart();

  return (
    <>
      <div className="overlay" id="overlay" onClick={close}></div>
      <div className="drawer" id="drawer">
        <div className="drawer-head">
          <h3>🛒 Aapka Cart</h3>
          <button className="close-x" onClick={close}>✕</button>
        </div>
        <div className="drawer-body">
          {!lines.length ? (
            <div className="empty-cart">
              <div style={{ fontSize: 52 }}>🛒</div>
              <p>Cart khaali hai.<br />Kuch swaadish order karo! 😋</p>
            </div>
          ) : (
            lines.map((l) => (
              <div className="cart-item" key={l.item.id}>
                <div className="ci-emoji">{l.item.photo ? <img src={l.item.photo} alt="" /> : l.item.emoji}</div>
                <div className="ci-info">
                  <b>{l.item.name}</b>
                  <div className="ci-price">₹{l.item.price} × {l.qty} = <b>₹{l.item.price * l.qty}</b></div>
                </div>
                <div className="qty">
                  <button onClick={() => setQty(l.item.id, l.qty - 1)}>−</button>
                  <span className="q">{l.qty}</span>
                  <button onClick={() => setQty(l.item.id, l.qty + 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>
        {lines.length > 0 && (
          <div className="drawer-foot">
            <div className="total-row">
              <span>Items ({count})</span>
              <b>₹{total}</b>
            </div>
            <div className="total-row">
              <span>Delivery</span>
              <b>₹{bandCharge(settings, 2)}*</b>
            </div>
            <button
              className="checkout-btn"
              onClick={() => {
                close();
                document.getElementById("modal")?.classList.add("show");
              }}
            >
              Checkout →
            </button>
            <div className="micro-note">*Delivery distance checkout pe select hogi</div>
          </div>
        )}
      </div>
    </>
  );
}

function close() {
  document.getElementById("drawer")?.classList.remove("show");
  document.getElementById("overlay")?.classList.remove("show");
}

"use client";

// 📍 Checkout modal — naam/phone/address + delivery bands + bill + WhatsApp order

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Settings } from "@/lib/types";
import { bandCharge } from "@/lib/data";

export default function CheckoutModal({ settings }: { settings: Settings }) {
  const { lines, total, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [km, setKm] = useState(2);
  const [sending, setSending] = useState(false);

  const del = bandCharge(settings, km);
  const grand = total + del;

  async function placeOrder() {
    if (!name.trim() || phone.trim().length < 10 || !addr.trim()) {
      toast("Naam, phone aur address sahi bharein!");
      return;
    }
    if (!lines.length) return;
    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          address: addr.trim(),
          items: lines.map((l) => ({
            itemId: l.item.id,
            name: l.item.name,
            price: l.item.price,
            qty: l.qty,
          })),
          itemTotal: total,
          deliveryCharge: del,
          grandTotal: grand,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order fail");

      // ✅ Success screen
      document.getElementById("modal")?.classList.remove("show");
      showSuccess(data.orderNo);

      // 💬 WhatsApp message + wa.me link
      const msg = buildWhatsAppMsg(data.orderNo, name, phone, addr, del);
      window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");

      clear();
    } catch (e: any) {
      toast("❌ " + (e?.message || "kuch gadbad hui"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal" id="modal">
      <div className="modal-box">
        <h3>📍 Order Confirm Karein</h3>

        <div className="field">
          <label>Naam</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aapka naam" />
        </div>
        <div className="field">
          <label>Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="10 digit mobile number" />
        </div>
        <div className="field">
          <label>Delivery Address</label>
          <textarea value={addr} onChange={(e) => setAddr(e.target.value)} rows={2} placeholder="Pura address likhein" />
        </div>

        <div className="field">
          <label>Delivery Distance</label>
          <div className="band-options">
            {(settings.deliveryBands || []).map((b) => (
              <div
                key={b.km}
                className={`band-opt ${km === b.km ? "active" : ""}`}
                onClick={() => setKm(b.km)}
              >
                {b.km === 99 ? "5+ km" : `0–${b.km} km`}
                <small>₹{b.charge}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="bill">
          <div className="row"><span>Item Total</span><span>₹{total}</span></div>
          <div className="row"><span>Delivery Charge</span><span>₹{del}</span></div>
          <div className="row grand"><span>Grand Total</span><span>₹{grand}</span></div>
        </div>

        <button className="wa-btn" onClick={placeOrder} disabled={sending}>
          {sending ? "Order bhej rahe hain..." : "💬 WhatsApp pe Order Bhejo"}
        </button>
      </div>
    </div>
  );
}

function buildWhatsAppMsg(orderNo: string, name: string, phone: string, addr: string, del: number) {
  const order: any = JSON.parse(localStorage.getItem("gangaram_cart") || "[]");
  const items = order.map((l: any) => `• ${l.item.name} × ${l.qty} = ₹${l.item.price * l.qty}`).join("\n");
  const itemTotal = order.reduce((a: number, l: any) => a + l.item.price * l.qty, 0);
  return [
    `🍽️ *NEW ORDER — ${orderNo}*`,
    "━━━━━━━━━━━━━",
    `👤 *Naam:* ${name}`,
    `📞 *Phone:* ${phone}`,
    `📍 *Address:* ${addr}`,
    "━━━━━━━━━━━━━",
    items,
    "━━━━━━━━━━━━━",
    `🧾 *Item Total:* ₹${itemTotal}`,
    `🛵 *Delivery:* ₹${del}`,
    `💵 *Grand Total:* ₹${itemTotal + del}`,
    "━━━━━━━━━━━━━",
    "— Sent via Gangaram Dairy Direct Order",
  ].join("\n");
}

function showSuccess(orderNo: string) {
  const el = document.getElementById("success");
  if (!el) return;
  document.getElementById("orderNo")!.textContent = orderNo;
  el.classList.add("show");
}

function toast(msg: string) {
  const t = document.getElementById("toast")!;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout((t as any)._h);
  (t as any)._h = setTimeout(() => t.classList.remove("show"), 1900);
}

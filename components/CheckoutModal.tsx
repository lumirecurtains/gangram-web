"use client";

// 📍 Checkout Modal — Official Sprint 2 Rebuild (Engineering Review Spec)
// Rebuild Features:
// 1. Genuine Firebase Phone Auth (Zero fake fallbacks, zero hardcoded 123456 bypasses)
// 2. Granular, honest Firebase error handling (invalid phone, quota exceeded, captcha fail, wrong OTP, expired OTP)
// 3. Separate "Resend OTP" with 45-second Cooldown Timer & "Change Number" actions
// 4. Geolocation HTTPS / Secure Context check + Granular GPS Error Mapping (Permission Denied vs Unavailable vs Timeout)
// 5. Uniform Eligibility Check across BOTH GPS distance AND manual distance selection
// 6. Automatic Delivery Fee Calculation (Base + Per-KM) & Bill Breakdown
// 7. Visual 4-Step Checkout Progress Indicator (1. Phone Auth → 2. Details → 3. Location → 4. Review & Order)

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { Settings } from "@/lib/types";
import { bandCharge, calculateDistanceKm, calculateDeliveryFee } from "@/lib/data";
import { auth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

export default function CheckoutModal({ settings }: { settings: Settings }) {
  const { lines, total, clear } = useCart();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 1️⃣ Auth State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // 2️⃣ Customer Details State
  const [name, setName] = useState("");
  const [addr, setAddr] = useState("");

  // 3️⃣ Geolocation & Distance State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [manualKm, setManualKm] = useState(2);

  // 4️⃣ Order Submission State
  const [sending, setSending] = useState(false);

  // Track Firebase Auth State & Session Persistence
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u?.phoneNumber) {
        setPhone(u.phoneNumber.replace("+91", ""));
      }
    });
    return () => unsub();
  }, []);

  // Resend OTP Cooldown Timer (Task 1)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Recaptcha Verifier Initialization
  function getRecaptchaVerifier() {
    if (typeof window === "undefined") return null;
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier;
    }
    try {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          setAuthError("reCAPTCHA session expired. Please retry.");
        },
      });
      (window as any).recaptchaVerifier = verifier;
      return verifier;
    } catch (err: any) {
      console.error("reCAPTCHA init error:", err);
      return null;
    }
  }

  // Send / Resend Phone OTP (Task 1 - Honest Error Handling, No Fakes)
  async function handleSendOtp(isResend = false) {
    setAuthError("");
    const cleanPhone = phone.trim();

    if (!/^\d{10}$/.test(cleanPhone)) {
      setAuthError("Kripya sahi 10-digit mobile number enter karein.");
      return;
    }

    setAuthLoading(true);
    try {
      const formatted = `+91${cleanPhone}`;
      const verifier = getRecaptchaVerifier();

      if (!verifier) {
        throw new Error("reCAPTCHA initialization failed.");
      }

      const res = await signInWithPhoneNumber(auth, formatted, verifier);
      setConfirmResult(res);
      setOtpSent(true);
      setResendCooldown(45); // Start 45s cooldown
      toast(isResend ? "📱 Naya OTP bhej diya gaya hai!" : "📱 OTP mobile par bhej diya gaya hai!");
    } catch (err: any) {
      console.error("Firebase Phone Auth error:", err);
      let userMsg = "OTP bhejte waqt problem aayi. Kripya dobara koshish karein.";

      if (err?.code === "auth/invalid-phone-number") {
        userMsg = "Kripya sahi 10-digit mobile number check karke enter karein.";
      } else if (err?.code === "auth/too-many-requests") {
        userMsg = "Bahut zyada OTP requests bhej diye gaye hain. Kripya thodi der baad try karein.";
      } else if (err?.code === "auth/quota-exceeded") {
        userMsg = "SMS quota limit exceed ho gayi hai. Admin se sampark karein.";
      } else if (err?.code === "auth/captcha-check-failed") {
        userMsg = "reCAPTCHA verification fail ho gaya. Page refresh karke try karein.";
      } else if (err?.message) {
        userMsg = `Firebase Auth Error: ${err.message}`;
      }

      setAuthError(userMsg);
    } finally {
      setAuthLoading(false);
    }
  }

  // Verify OTP (Task 1 - Honest Verification, No Hardcoded Bypass)
  async function handleVerifyOtp() {
    setAuthError("");
    const cleanOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      setAuthError("Kripya sahi 6-digit OTP code enter karein.");
      return;
    }

    if (!confirmResult) {
      setAuthError("Pehle 'Send OTP' button par click karein.");
      return;
    }

    setAuthLoading(true);
    try {
      await confirmResult.confirm(cleanOtp);
      toast("✅ Phone number successfully verified!");
      setOtpSent(false);
      setAuthError("");
    } catch (err: any) {
      console.error("OTP verification error:", err);
      let userMsg = "Galat OTP! Kripya sahi 6-digit code enter karein.";

      if (err?.code === "auth/invalid-verification-code") {
        userMsg = "Galat OTP code! Kripya SMS me aaya 6-digit code enter karein.";
      } else if (err?.code === "auth/code-expired") {
        userMsg = "OTP code expire ho gaya hai. 'Resend OTP' button par click karein.";
      }

      setAuthError(userMsg);
    } finally {
      setAuthLoading(false);
    }
  }

  // Customer Logout Action
  async function handleCustomerLogout() {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setOtpSent(false);
      setConfirmResult(null);
      setOtp("");
      toast("Signed out successfully.");
    } catch (err: any) {
      toast("Logout failed: " + err?.message);
    }
  }

  // GPS Location Detection (Task 2 - HTTPS Guard & Granular Error Mapping)
  function detectGpsLocation() {
    setLocError("");

    // 1️⃣ Secure Context Check (HTTPS or localhost)
    if (typeof window !== "undefined" && window.isSecureContext === false && window.location.hostname !== "localhost") {
      setLocError("📍 GPS location detection requires a secure (HTTPS) connection. Please type your address manually below.");
      return;
    }

    if (!navigator.geolocation) {
      setLocError("Aapke browser me GPS Geolocation support nahi hai. Kripya address manually bharein.");
      return;
    }

    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });

        // Calculate straight-line distance from restaurant
        const restLat = settings.restaurantLat ?? 25.4181;
        const restLng = settings.restaurantLng ?? 86.1272;
        const calcKm = calculateDistanceKm(restLat, restLng, lat, lng);
        setDistanceKm(calcKm);
        setLocLoading(false);
        toast(`📍 Location detected! Distance: ${calcKm} km`);
      },
      (err) => {
        setLocLoading(false);
        // Granular GPS Error Code Mapping (Engineering Review Section 13.2)
        if (err.code === 1) {
          setLocError("Location access was denied. You can still enter your address manually below.");
        } else if (err.code === 2) {
          setLocError("We couldn't determine your location right now. Please enter your address manually below.");
        } else if (err.code === 3) {
          setLocError("Location detection took too long. Please try again or enter your address manually below.");
        } else {
          setLocError("GPS detection error. Kripya apna address niche manually enter karein.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  // Delivery Eligibility Check (Task 4 - Uniform Enforcement across GPS & Manual)
  const maxKm = settings.maxDeliveryKm ?? 5;
  const isGpsActive = distanceKm !== null;
  const effectiveDistance = isGpsActive ? (distanceKm as number) : manualKm;
  const isIneligible = effectiveDistance > maxKm;

  // Delivery Fee Calculation (Task 5 - Auto vs Band Fallback)
  const del = isGpsActive
    ? calculateDeliveryFee(settings, distanceKm as number)
    : bandCharge(settings, manualKm);

  const grand = total + del;

  // Place Order Action
  async function placeOrder() {
    if (!currentUser && !auth.currentUser) {
      setAuthError("Pehle phone number verify karna zaroori hai.");
      toast("Pehle Phone OTP verify karein!");
      return;
    }
    if (!name.trim() || !addr.trim()) {
      toast("Naam aur Delivery Address dono bharein!");
      return;
    }
    if (isIneligible) {
      toast(`Sorry, hum ${maxKm} km se zyada door delivery nahi karte.`);
      return;
    }
    if (!lines.length) return;

    setSending(true);
    try {
      const finalPhone = (currentUser?.phoneNumber || phone).replace("+91", "").trim();
      const idToken = await currentUser?.getIdToken();

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: finalPhone,
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
          distanceKm: isGpsActive ? distanceKm : null,
          manualKm: isGpsActive ? null : manualKm,
          idToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order fail");

      // Success Modal Display
      document.getElementById("modal")?.classList.remove("show");
      showSuccess(data.orderNo);

      // WhatsApp Message Handoff
      const msg = buildWhatsAppMsg(data.orderNo, name, finalPhone, addr, del, distanceKm);
      window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");

      clear();
    } catch (e: any) {
      toast("❌ " + (e?.message || "Order submit karte me error aaya"));
    } finally {
      setSending(false);
    }
  }

  // Determine current active step (Task 7 Step Indicator)
  const step1Done = !!currentUser;
  const step2Done = step1Done && name.trim().length > 0 && addr.trim().length > 0;
  const step3Done = step2Done && !isIneligible;

  return (
    <div className="modal" id="modal">
      <div className="modal-box" style={{ maxWidth: 460, borderRadius: 24, padding: "20px 22px" }}>
        <div id="recaptcha-container"></div>

        {/* Task 7: Visual Step Progress Indicator */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f1e8dc" }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: step1Done ? "#16a34a" : "#d97706" }}>
            1. 📱 Auth {step1Done ? "✓" : ""}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: step2Done ? "#16a34a" : "#78716c" }}>
            2. 👤 Details {step2Done ? "✓" : ""}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: step3Done ? "#16a34a" : "#78716c" }}>
            3. 📍 Location {step3Done ? "✓" : ""}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "#78716c" }}>
            4. 🧾 Order
          </div>
        </div>

        <h3 style={{ fontSize: 18, marginBottom: 14 }}>📍 Order & Delivery Verification</h3>

        {/* Task 1: Phone Authentication Card */}
        <div className="bill" style={{ marginBottom: 14, background: "#fffaf0", border: "1px solid #fde68a" }}>
          {currentUser ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b style={{ fontSize: 13, color: "#16a34a" }}>✅ Verified Customer Phone</b>
                <div style={{ fontSize: 12.5, color: "#292524", fontWeight: 700, marginTop: 2 }}>
                  {currentUser.phoneNumber}
                </div>
              </div>
              <button
                type="button"
                className="dash-mini"
                style={{ fontSize: 11.5, background: "#fee2e2", color: "#dc2626", border: "none" }}
                onClick={handleCustomerLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div>
              <b style={{ fontSize: 13, color: "#1c1917" }}>📱 Step 1: Customer Phone Verification</b>
              <div style={{ fontSize: 11.5, color: "#78716c", marginTop: 2 }}>
                Order place karne ke liye phone OTP verify karna zaroori hai.
              </div>

              {!otpSent ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="dash-input"
                      type="tel"
                      placeholder="10 Digit Mobile Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ margin: 0, flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: "8px 14px", fontSize: 12.5, whiteSpace: "nowrap" }}
                      onClick={() => handleSendOtp(false)}
                      disabled={authLoading}
                    >
                      {authLoading ? "Sending..." : "Send OTP →"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="dash-input"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      style={{ margin: 0, flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: "8px 14px", fontSize: 12.5, whiteSpace: "nowrap" }}
                      onClick={handleVerifyOtp}
                      disabled={authLoading}
                    >
                      {authLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>

                  {/* Resend OTP Cooldown & Change Number Actions */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <button
                      type="button"
                      style={{
                        fontSize: 11.5,
                        color: resendCooldown > 0 ? "#a8a29e" : "#d97706",
                        fontWeight: 700,
                        background: "none",
                        border: "none",
                        cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                        padding: 0,
                      }}
                      disabled={resendCooldown > 0 || authLoading}
                      onClick={() => handleSendOtp(true)}
                    >
                      {resendCooldown > 0 ? `⏳ Resend OTP in ${resendCooldown}s` : "🔄 Resend OTP"}
                    </button>

                    <button
                      type="button"
                      style={{ fontSize: 11.5, color: "#78716c", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      onClick={() => {
                        setOtpSent(false);
                        setAuthError("");
                      }}
                    >
                      ✏️ Change Number
                    </button>
                  </div>
                </div>
              )}

              {/* Surfaced Honest Error Messages */}
              {authError && (
                <div style={{ background: "#fee2e2", border: "1px solid #ef4444", color: "#b91c1c", padding: "8px 10px", borderRadius: 8, fontSize: 11.5, marginTop: 8 }}>
                  {authError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Customer Details Form */}
        <div className="field">
          <label>Aapka Full Naam</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter Your Name" />
        </div>

        {/* Step 3: Location Detection & Uniform Distance Check */}
        <div className="field">
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Delivery Location & Radius Check</span>
            {isGpsActive && (
              <span style={{ color: "#d97706", fontWeight: 900, fontSize: 12.5 }}>📍 {distanceKm} km (GPS)</span>
            )}
          </label>

          <button
            type="button"
            className="btn-ghost"
            style={{ width: "100%", padding: "10px 14px", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}
            onClick={detectGpsLocation}
            disabled={locLoading}
          >
            {locLoading ? "⏳ Detecting GPS Coordinates..." : "📍 Detect My Location (GPS)"}
          </button>

          {/* Granular GPS Error Banner */}
          {locError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", padding: "8px 10px", borderRadius: 8, fontSize: 11.5, marginBottom: 8 }}>
              {locError}
            </div>
          )}

          {/* Task 4: Ineligibility Alert Banner (Enforced on both GPS and Manual) */}
          {isIneligible && (
            <div style={{ background: "#fee2e2", border: "1.5px solid #ef4444", color: "#b91c1c", padding: "10px 12px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
              🚫 Sorry, we currently do not deliver to your location ({effectiveDistance} km). Maximum allowed delivery radius is {maxKm} km.
            </div>
          )}

          {/* Manual Address Fallback */}
          <label style={{ fontSize: 11.5, color: "#78716c", marginTop: 4 }}>Delivery Address (House/Street/Landmark)</label>
          <textarea
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            rows={2}
            placeholder="Pura address likhein..."
          />
        </div>

        {/* Distance Band Manual Fallback (Only if GPS not active) */}
        {!isGpsActive && (
          <div className="field">
            <label>Approx Distance (Manual Fallback)</label>
            <div className="band-options">
              {(settings.deliveryBands || []).map((b) => (
                <div
                  key={b.km}
                  className={`band-opt ${manualKm === b.km ? "active" : ""}`}
                  onClick={() => setManualKm(b.km)}
                >
                  {b.km === 99 ? "5+ km" : `0–${b.km} km`}
                  <small>₹{b.charge}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Bill Summary & Order Action */}
        <div className="bill" style={{ marginTop: 14 }}>
          <div className="row"><span>Item Total</span><span>₹{total}</span></div>
          <div className="row">
            <span>Delivery Fee {isGpsActive ? `(${distanceKm} km auto)` : `(${manualKm} km)`}</span>
            <span>₹{del}</span>
          </div>
          <div className="row grand"><span>Grand Total</span><span>₹{grand}</span></div>
        </div>

        <button
          className="wa-btn"
          onClick={placeOrder}
          disabled={sending || isIneligible || (!currentUser && !auth.currentUser)}
          style={
            isIneligible || (!currentUser && !auth.currentUser)
              ? { opacity: 0.65, cursor: "not-allowed" }
              : {}
          }
        >
          {sending
            ? "Order Submit Ho Raha Hai..."
            : isIneligible
            ? `🚫 Location Out of Delivery Area (${effectiveDistance} km > ${maxKm} km)`
            : !currentUser
            ? "🔒 Please Verify Phone Number to Order"
            : "💬 WhatsApp pe Order Bhejo"}
        </button>
      </div>
    </div>
  );
}

function buildWhatsAppMsg(
  orderNo: string,
  name: string,
  phone: string,
  addr: string,
  del: number,
  distKm: number | null
) {
  const order: any = JSON.parse(localStorage.getItem("gangaram_cart") || "[]");
  const items = order.map((l: any) => `• ${l.item.name} × ${l.qty} = ₹${l.item.price * l.qty}`).join("\n");
  const itemTotal = order.reduce((a: number, l: any) => a + l.item.price * l.qty, 0);
  const distText = distKm !== null ? `${distKm} km (GPS Verified)` : "Standard";

  return [
    `🍽️ *NEW VERIFIED ORDER — ${orderNo}*`,
    "━━━━━━━━━━━━━",
    `👤 *Customer:* ${name}`,
    `📞 *Verified Phone:* +91 ${phone}`,
    `📍 *Address:* ${addr}`,
    `🛵 *Delivery Distance:* ${distText}`,
    "━━━━━━━━━━━━━",
    items,
    "━━━━━━━━━━━━━",
    `🧾 *Item Total:* ₹${itemTotal}`,
    `🛵 *Delivery Charge:* ₹${del}`,
    `💵 *Grand Total:* ₹${itemTotal + del}`,
    "━━━━━━━━━━━━━",
    "— Verified via Gangaram Dairy Online Checkout",
  ].join("\n");
}

function showSuccess(orderNo: string) {
  const el = document.getElementById("success");
  if (!el) return;
  const numEl = document.getElementById("orderNo");
  if (numEl) numEl.textContent = orderNo;
  el.classList.add("show");
}

function toast(msg: string) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout((t as any)._h);
  (t as any)._h = setTimeout(() => t.classList.remove("show"), 2500);
}

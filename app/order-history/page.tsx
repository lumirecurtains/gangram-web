"use client";

// 📜 Order History — customer order tracking & reviews
// Security Sprint S2: Session-scoped Firebase ID Token verification required for Order History Access (C-3)

import { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerOrderTracker } from "@/components/CustomerOrderTracker";
import { auth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
  User,
} from "firebase/auth";

export default function OrderHistoryPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // OTP Verification state for direct visits without active session
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Review form state
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rRating, setRRating] = useState(5);
  const [rText, setRText] = useState("");
  const [rMsg, setRMsg] = useState("");

  // Track Firebase Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u?.phoneNumber) {
        const cleanP = u.phoneNumber.replace("+91", "").trim();
        setPhone(cleanP);
      }
    });
    return () => unsub();
  }, []);

  async function fetchHistory(targetPhone: string) {
    if (targetPhone.length < 10) return;
    setLoading(true);
    setAuthError("");
    try {
      const u = auth.currentUser;
      const idToken = u ? await u.getIdToken() : null;

      const headers: Record<string, string> = {};
      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const res = await fetch(`/api/orders/history?phone=${encodeURIComponent(targetPhone)}`, {
        headers,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error) {
          setAuthError(data.error);
        }
        setOrders([]);
      } else {
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      }
    } catch (err: any) {
      console.warn("Order history fetch error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  // Automatic session carry-forward check (UX Completion Sprint)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhone = sessionStorage.getItem("gangaram_tracking_phone");
      if (savedPhone && savedPhone.length >= 10) {
        setPhone(savedPhone);
        sessionStorage.removeItem("gangaram_tracking_phone");
        fetchHistory(savedPhone);
      } else if (auth.currentUser?.phoneNumber) {
        const cleanP = auth.currentUser.phoneNumber.replace("+91", "").trim();
        setPhone(cleanP);
        fetchHistory(cleanP);
      }
    }
  }, []);

  async function search() {
    if (phone.length < 10) return;
    await fetchHistory(phone);
  }

  // Live tracking polling when orders exist
  useEffect(() => {
    if (!orders || phone.length < 10 || !auth.currentUser) return;
    const interval = setInterval(async () => {
      try {
        const u = auth.currentUser;
        const idToken = u ? await u.getIdToken() : null;
        if (!idToken) return;

        const res = await fetch(`/api/orders/history?phone=${encodeURIComponent(phone)}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (data.ok && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.warn("Live tracking sync notice:", err);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [orders, phone]);

  // Recaptcha Verifier Initialization for inline OTP Verification
  function getRecaptchaVerifier() {
    if (typeof window === "undefined") return null;
    if ((window as any).recaptchaVerifierHistory) {
      return (window as any).recaptchaVerifierHistory;
    }
    try {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-history-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          setAuthError("reCAPTCHA session expired. Please retry.");
        },
      });
      (window as any).recaptchaVerifierHistory = verifier;
      return verifier;
    } catch (err: any) {
      console.error("reCAPTCHA init error:", err);
      return null;
    }
  }

  async function handleSendOtp() {
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
      if (!verifier) throw new Error("reCAPTCHA initialization failed.");

      const res = await signInWithPhoneNumber(auth, formatted, verifier);
      setConfirmResult(res);
      setOtpSent(true);
    } catch (err: any) {
      console.error("Firebase Phone Auth error:", err);
      setAuthError(err?.message || "OTP bhejte waqt problem aayi.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setAuthError("");
    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp) || !confirmResult) {
      setAuthError("Kripya 6-digit OTP code enter karein.");
      return;
    }
    setAuthLoading(true);
    try {
      await confirmResult.confirm(cleanOtp);
      setOtpSent(false);
      setAuthError("");
      await fetchHistory(phone);
    } catch (err: any) {
      console.error("OTP verification error:", err);
      setAuthError("Galat OTP code! Kripya sahi 6-digit code enter karein.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function submitReview() {
    if (rName.trim().length < 2 || rPhone.length < 10 || rText.trim().length < 3) {
      setRMsg("Naam, phone aur thodi review likho!");
      return;
    }
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rName, phone: rPhone, rating: rRating, text: rText }),
    });
    const data = await res.json();
    setRMsg(data.ok ? "✅ Review submit ho gaya! Dhanyawad 🙏" : "❌ " + (data.error || "Fail"));
    if (data.ok) { setRName(""); setRText(""); }
  }

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 60px" }}>
      <div id="recaptcha-history-container"></div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <b style={{ fontSize: 18 }}>🥛 Gangaram Dairy</b>
        <Link href="/" style={{ color: "#d97706", fontSize: 13, fontWeight: 700 }}>← Menu</Link>
      </header>

      <h1 style={{ fontSize: 22, fontWeight: 900 }}>📜 Order Tracking & History</h1>
      <p style={{ fontSize: 13.5, color: "#78716c", margin: "6px 0 14px" }}>
        Apna phone number OTP se verify karein — aapke active orders ka live status dikh jayegi.
      </p>

      {/* Phone Input & Verification Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="dash-input"
            type="tel"
            placeholder="10 digit phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {currentUser ? (
            <button className="btn-primary" style={{ padding: "0 18px", fontSize: 13.5 }} onClick={search} disabled={loading}>
              {loading ? "..." : "Dhoondo"}
            </button>
          ) : !otpSent ? (
            <button className="btn-primary" style={{ padding: "0 14px", fontSize: 12.5, whiteSpace: "nowrap" }} onClick={handleSendOtp} disabled={authLoading}>
              {authLoading ? "Sending..." : "Send OTP"}
            </button>
          ) : null}
        </div>

        {!currentUser && otpSent && (
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input
              className="dash-input"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button className="btn-primary" style={{ padding: "0 14px", fontSize: 12.5, whiteSpace: "nowrap" }} onClick={handleVerifyOtp} disabled={authLoading}>
              {authLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        )}
      </div>

      {authError && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginTop: 10 }}>
          ⚠️ {authError}
        </div>
      )}

      {orders && (
        <div style={{ marginTop: 16 }}>
          {orders.length === 0 ? (
            <p style={{ color: "#a8a29e", fontSize: 13.5 }}>Is number pe koi order nahi mila.</p>
          ) : (
            orders.map((o) => (
              <CustomerOrderTracker key={o.id} order={o} onRefresh={search} />
            ))
          )}
        </div>
      )}

      <div className="dash-card" style={{ marginTop: 22 }}>
        <h3 style={{ fontSize: 16, marginBottom: 10 }}>⭐ Review Do</h3>
        <input className="dash-input" placeholder="Naam" value={rName} onChange={(e) => setRName(e.target.value)} />
        <input className="dash-input" type="tel" placeholder="Phone" value={rPhone} onChange={(e) => setRPhone(e.target.value)} />
        <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRRating(n)} style={{ fontSize: 22, background: "none", border: "none", opacity: n <= rRating ? 1 : 0.25 }}>
              ★
            </button>
          ))}
        </div>
        <textarea className="dash-input" rows={2} placeholder="Aapka experience kaisa raha?" value={rText} onChange={(e) => setRText(e.target.value)} />
        <button className="btn-primary" style={{ marginTop: 8, width: "100%" }} onClick={submitReview}>Submit Review</button>
        {rMsg && <p style={{ fontSize: 13, fontWeight: 700, marginTop: 8, color: rMsg.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{rMsg}</p>}
      </div>
    </main>
  );
}

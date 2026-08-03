"use client";

// 🛵 Customer Order Tracker Component — Sprint T4 Post-Delivery Experience
// Read-only customer live tracking view with 6-stage linear progress tracker,
// Delivery Confirmation Card, Rating & Review Trigger, Optional Delivery Proof,
// Auto-confirmation fallback, and Repeat Order action.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Order, OrderStatus } from "@/lib/types";
import { STAGE_MESSAGES } from "@/lib/tracking-constants";

export const CUSTOMER_TRACKING_STAGES: { stage: OrderStatus; label: string; icon: string }[] = [
  { stage: "placed", label: "Order Received", icon: "📋" },
  { stage: "accepted", label: "Order Accepted", icon: "🔵" },
  { stage: "preparing", label: "Preparing Food", icon: "🍳" },
  { stage: "packed", label: "Packed & Ready", icon: "📦" },
  { stage: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
  { stage: "delivered", label: "Delivered", icon: "🎉" },
];

export function CustomerOrderTracker({
  order,
  onRefresh,
}: {
  order: Order;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const currentStatus = order.status || "placed";
  const isCancelled = currentStatus === "cancelled";

  // Post-delivery state handlers
  const [confirming, setConfirming] = useState(false);
  const [proofNote, setProofNote] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  // Determine stage index in the 6-stage lifecycle
  const currentStageIndex = CUSTOMER_TRACKING_STAGES.findIndex((s) => s.stage === currentStatus);

  // ETA Delivery Window string
  let etaWindowStr: string | null = null;
  if (order.estimatedWindowStart && order.estimatedWindowEnd) {
    const startStr = new Date(order.estimatedWindowStart).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endStr = new Date(order.estimatedWindowEnd).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    etaWindowStr = `${startStr} – ${endStr}`;
  }

  // Active status message
  const activeMessage = STAGE_MESSAGES[currentStatus] || "Order is in progress";

  // 1️⃣ Customer Delivery Confirmation Action
  async function handleConfirmDelivery() {
    setConfirming(true);
    try {
      const res = await fetch("/api/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          targetStatus: "customer_confirmed",
          actor: "customer",
          deliveryProofNote: proofNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Confirmation failed: " + (data.error || "Error"));
      } else {
        if (onRefresh) onRefresh();
      }
    } catch (e: any) {
      alert("Error: " + (e?.message || e));
    } finally {
      setConfirming(false);
    }
  }

  // 2️⃣ Submit Rating & Review Handoff Action
  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewText.trim() || reviewText.trim().length < 3) {
      setReviewMsg("Thodi si review likho!");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: order.customerName,
          phone: order.customerPhone,
          rating: reviewRating,
          text: reviewText.trim(),
          orderId: order.id,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setReviewMsg("✅ Review submit ho gaya! Dhanyawad 🙏");
        if (onRefresh) onRefresh();
      } else {
        setReviewMsg("❌ " + (data.error || "Review submit fail"));
      }
    } catch (err: any) {
      setReviewMsg("❌ Error: " + (err?.message || err));
    } finally {
      setSubmittingReview(false);
    }
  }

  // 3️⃣ Repeat Order Action
  function handleRepeatOrder() {
    try {
      const cartLines = (order.items || []).map((it) => ({
        item: {
          id: it.itemId || `it_${it.name}`,
          name: it.name,
          price: it.price,
          desc: "",
          categoryId: "all",
          photo: "",
          emoji: "🍽️",
          veg: true,
          tag: "",
          available: true,
          order: 0,
        },
        qty: it.qty,
      }));

      localStorage.setItem("gangaram_cart", JSON.stringify(cartLines));
      router.push("/");
    } catch (e) {
      console.error("Repeat order error:", e);
      router.push("/");
    }
  }

  return (
    <div className="dash-card" style={{ background: "#ffffff", padding: 18, borderRadius: 16, border: "1px solid #f1e8dc", marginBottom: 16 }}>
      {/* Header Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <b style={{ fontSize: 16, color: "#1c1917" }}>{order.orderNo}</b>
          <div style={{ fontSize: 11.5, color: "#78716c", marginTop: 2 }}>
            Placed at {new Date(order.createdAt).toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#16a34a" }}>
          ₹{order.grandTotal}
        </div>
      </div>

      {/* Cancellation Banner */}
      {isCancelled ? (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 12, padding: "12px 14px", color: "#dc2626", marginBottom: 14 }}>
          <b style={{ fontSize: 13.5 }}>❌ Order Cancelled</b>
          <p style={{ fontSize: 12.5, margin: "4px 0 0", color: "#991b1b" }}>
            Gangaram Dairy is unable to complete this order.
          </p>
          {order.cancellationReason && (
            <div style={{ fontSize: 12, marginTop: 6, fontStyle: "italic", color: "#7f1d1d" }}>
              Reason: "{order.cancellationReason}"
            </div>
          )}
        </div>
      ) : (
        /* Active Status Highlight Card */
        <div style={{ background: "linear-gradient(135deg, #fffaf0, #fef3c7)", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#d97706", textTransform: "uppercase", letterSpacing: 0.5 }}>
            CURRENT STATUS
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1c1917", marginTop: 4 }}>
            {activeMessage}
          </div>

          {/* ETA Display */}
          {etaWindowStr && currentStatus !== "delivered" && currentStatus !== "customer_confirmed" && currentStatus !== "review_completed" && (
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#2563eb", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span>⏱️ Expected Arrival:</span>
              <span style={{ background: "#ffffff", padding: "2px 8px", borderRadius: 6, border: "1px solid #bfdbfe" }}>
                {etaWindowStr}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Linear Progress Tracker (6 Approved Stages) */}
      {!isCancelled && (
        <div style={{ padding: "8px 0 16px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#78716c", marginBottom: 12 }}>
            ORDER PROGRESS
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
            {CUSTOMER_TRACKING_STAGES.map((s, idx) => {
              const isCompleted = currentStageIndex > idx || currentStatus === "customer_confirmed" || currentStatus === "review_completed";
              const isCurrent = currentStageIndex === idx;

              return (
                <div key={s.stage} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Step Icon Indicator */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      background: isCurrent
                        ? "#f59e0b"
                        : isCompleted
                        ? "#16a34a"
                        : "#f3f4f6",
                      color: isCurrent || isCompleted ? "#ffffff" : "#a8a29e",
                      boxShadow: isCurrent ? "0 0 0 4px #fef3c7" : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isCompleted ? "✓" : s.icon}
                  </div>

                  {/* Step Label */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: isCurrent ? 800 : isCompleted ? 700 : 500,
                        color: isCurrent ? "#1c1917" : isCompleted ? "#16a34a" : "#a8a29e",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>

                  {isCurrent && (
                    <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>
                      IN PROGRESS
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SPRINT T4: Customer Delivery Confirmation Action Card */}
      {currentStatus === "delivered" && (
        <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 12, padding: "14px 16px", marginTop: 14, textAlign: "center" }}>
          <b style={{ fontSize: 15, color: "#166534" }}>🎉 Has your order arrived successfully?</b>
          <p style={{ fontSize: 12.5, color: "#15803d", margin: "4px 0 10px" }}>
            Please confirm receipt of your order from Gangaram Dairy.
          </p>

          <input
            className="dash-input"
            style={{ width: "100%", fontSize: 12, padding: "6px 10px", marginBottom: 8, borderRadius: 6 }}
            placeholder="Optional delivery proof note (e.g. Received at gate)"
            value={proofNote}
            onChange={(e) => setProofNote(e.target.value)}
          />

          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%", background: "#16a34a", fontWeight: 800, fontSize: 13.5 }}
            onClick={handleConfirmDelivery}
            disabled={confirming}
          >
            {confirming ? "Confirming..." : "Yes, I Received My Order ✅"}
          </button>
        </div>
      )}

      {/* SPRINT T4: Rating & Review Trigger Handoff Card */}
      {(currentStatus === "customer_confirmed" || currentStatus === "delivered") && (
        <div style={{ background: "#fffaf0", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px", marginTop: 14 }}>
          <b style={{ fontSize: 14.5, color: "#1c1917" }}>⭐ Rate Your Order Experience</b>
          <p style={{ fontSize: 12, color: "#78716c", margin: "2px 0 8px" }}>
            Share your feedback to help us maintain pure quality & fast service.
          </p>

          <form onSubmit={handleSubmitReview}>
            <div style={{ display: "flex", gap: 6, margin: "6px 0 10px" }}>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setReviewRating(num)}
                  style={{
                    fontSize: 22,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    opacity: num <= reviewRating ? 1 : 0.25,
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              className="dash-input"
              style={{ width: "100%", height: 60, fontSize: 12.5, padding: 8, borderRadius: 8, marginBottom: 8 }}
              placeholder="How was your food & delivery experience?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", fontSize: 13, background: "#d97706" }}
              disabled={submittingReview}
            >
              {submittingReview ? "Submitting..." : "Submit Review & Complete Order 🙏"}
            </button>
          </form>

          {reviewMsg && (
            <p style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8, color: reviewMsg.startsWith("✅") ? "#16a34a" : "#dc2626" }}>
              {reviewMsg}
            </p>
          )}
        </div>
      )}

      {/* SPRINT T4: Review Completed Banner */}
      {currentStatus === "review_completed" && (
        <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 12, padding: "12px 14px", marginTop: 14, textAlign: "center", color: "#166534" }}>
          <b style={{ fontSize: 14 }}>🙏 Thank you for your feedback!</b>
          <p style={{ fontSize: 12, margin: "2px 0 0" }}>
            Your review is recorded and helps us serve Gangaram Dairy customers better.
          </p>
        </div>
      )}

      {/* SPRINT T4: Repeat Order Action Button */}
      {(currentStatus === "delivered" || currentStatus === "customer_confirmed" || currentStatus === "review_completed") && (
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%", fontSize: 13, background: "#2563eb", fontWeight: 800 }}
            onClick={handleRepeatOrder}
          >
            Re-order Items 🛒
          </button>
        </div>
      )}

      {/* Timeline Log of Completed Stages */}
      {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "#78716c", marginBottom: 8, textTransform: "uppercase" }}>
            TIMELINE LOG
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {order.statusHistory.map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#57534e" }}>
                <span>✓ {STAGE_MESSAGES[h.stage] || h.stage}</span>
                <span style={{ color: "#a8a29e" }}>
                  {new Date(h.timestamp).toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Items Details */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #f1e8dc" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#78716c", marginBottom: 6 }}>
          ITEMS ORDERED
        </div>
        {(order.items || []).map((it, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "2px 0", color: "#44403c" }}>
            <span>{it.name} × {it.qty}</span>
            <b>₹{it.price * it.qty}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

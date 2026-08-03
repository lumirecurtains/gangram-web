"use client";

// 📦 Owner Orders Panel — Sprint T5 Reliability, Hardening & Delivery Analytics
// Implements 3-grouping order workflow, Single valid next-action button, Cancellation modal,
// Delivery Performance Analytics (Average Duration, Late Detection), Safe Polling, and Focus Sync.

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Order, OrderStatus } from "@/lib/types";

export default function OrdersPanel() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "new" | "in_progress" | "completed">("all");
  
  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Safe polling guard
  const isFetchingRef = useRef(false);

  async function loadOrders() {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.orders)) {
        setOrders(data.orders);
        setNetworkError(null);
      } else if (data.error) {
        setNetworkError(data.error);
      }
    } catch (err: any) {
      console.warn("Load orders network warning:", err);
      setNetworkError("Connection offline. Retrying automatically…");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // Safe polling timer (10s interval)
    const timer = setInterval(loadOrders, 10000);
    // Multiple-tab window focus listener for instant sync
    const handleFocus = () => loadOrders();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);

  // Execute Status Transition via Sprint T1 Server API
  async function transitionStatus(orderId: string, targetStatus: OrderStatus, reason?: string) {
    if (processingId === orderId) return; // Debounce double clicks
    setProcessingId(orderId);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/orders/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          targetStatus,
          reason,
          actor: "owner",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Transition failed: " + (data.error || "Unknown error"));
      } else {
        await loadOrders(); // Instant refresh after transition
      }
    } catch (e: any) {
      alert("Network error: " + (e?.message || "Please check connection"));
    } finally {
      setProcessingId(null);
    }
  }

  // Handle Cancellation Submission
  async function handleConfirmCancel() {
    if (!cancelReason.trim()) {
      setCancelError("Cancellation reason is mandatory!");
      return;
    }
    if (!cancellingOrder) return;

    setCancelError("");
    const orderId = cancellingOrder.id;
    const reason = cancelReason.trim();
    setCancellingOrder(null);
    setCancelReason("");

    await transitionStatus(orderId, "cancelled", reason);
  }

  if (loading) {
    return <div style={{ padding: 24, textAlign: "center", color: "#a8a29e" }}>Loading active orders…</div>;
  }

  // 1️⃣ Groupings & Delivery Analytics Math (Sprint T5)
  const newOrders = orders.filter((o) => o.status === "placed");
  const inProgressOrders = orders.filter((o) =>
    ["accepted", "preparing", "packed", "out_for_delivery"].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ["delivered", "customer_confirmed", "review_completed", "cancelled"].includes(o.status)
  );

  // Delivery Duration Analytics: Average Duration (acceptedAt -> deliveredAt)
  const deliveredWithTimes = orders.filter((o) => o.acceptedAt && o.deliveredAt);
  const totalDeliveredMins = deliveredWithTimes.reduce(
    (acc, o) => acc + Math.round((o.deliveredAt! - o.acceptedAt!) / 60000),
    0
  );
  const avgDeliveryMin = deliveredWithTimes.length
    ? Math.round(totalDeliveredMins / deliveredWithTimes.length)
    : 25;

  // Late Deliveries Detector
  const now = Date.now();
  const lateOrders = orders.filter((o) => {
    if (o.status === "out_for_delivery" && o.estimatedWindowEnd) {
      return now > o.estimatedWindowEnd;
    }
    if (o.acceptedAt && o.deliveredAt) {
      const dur = Math.round((o.deliveredAt - o.acceptedAt) / 60000);
      return dur > 45;
    }
    return false;
  });

  // Filtered List
  const displayOrders =
    activeFilter === "new"
      ? newOrders
      : activeFilter === "in_progress"
      ? inProgressOrders
      : activeFilter === "completed"
      ? completedOrders
      : orders;

  // Helper for Status Badge Styling
  function renderStatusBadge(status: OrderStatus) {
    switch (status) {
      case "placed":
        return <span style={{ background: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontSize: 11.5 }}>🔔 New Order</span>;
      case "accepted":
        return <span style={{ background: "#dbeafe", color: "#1e40af", padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontSize: 11.5 }}>🔵 Accepted</span>;
      case "preparing":
        return <span style={{ background: "#f3e8ff", color: "#6b21a8", padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontSize: 11.5 }}>🍳 Preparing</span>;
      case "packed":
        return <span style={{ background: "#ccfbf1", color: "#115e59", padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontSize: 11.5 }}>📦 Packed</span>;
      case "out_for_delivery":
        return <span style={{ background: "#ffedd5", color: "#c2410c", padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontSize: 11.5 }}>🛵 Out for Delivery</span>;
      case "delivered":
      case "customer_confirmed":
      case "review_completed":
        return <span style={{ background: "#dcfce7", color: "#16a34a", padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontSize: 11.5 }}>✅ Delivered</span>;
      case "cancelled":
        return <span style={{ background: "#fee2e2", color: "#dc2626", padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontSize: 11.5 }}>❌ Cancelled</span>;
      default:
        return <span style={{ background: "#f3f4f6", color: "#4b5563", padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontSize: 11.5 }}>{status}</span>;
    }
  }

  // Render Single Valid Action Button
  function renderActionButton(o: Order) {
    const isBusy = processingId === o.id;

    switch (o.status) {
      case "placed":
        return (
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: 13, padding: "8px 14px", fontWeight: 800, background: "#16a34a" }}
            onClick={() => transitionStatus(o.id, "accepted")}
            disabled={isBusy}
          >
            {isBusy ? "Accepting…" : "Accept Order →"}
          </button>
        );

      case "accepted":
        return (
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: 13, padding: "8px 14px", fontWeight: 800, background: "#2563eb" }}
            onClick={() => transitionStatus(o.id, "preparing")}
            disabled={isBusy}
          >
            {isBusy ? "Updating…" : "Start Preparing 🍳"}
          </button>
        );

      case "preparing":
        return (
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: 13, padding: "8px 14px", fontWeight: 800, background: "#9333ea" }}
            onClick={() => transitionStatus(o.id, "packed")}
            disabled={isBusy}
          >
            {isBusy ? "Updating…" : "Mark Packed 📦"}
          </button>
        );

      case "packed":
        return (
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: 13, padding: "8px 14px", fontWeight: 800, background: "#ea580c" }}
            onClick={() => transitionStatus(o.id, "out_for_delivery")}
            disabled={isBusy}
          >
            {isBusy ? "Updating…" : "Out For Delivery 🛵"}
          </button>
        );

      case "out_for_delivery":
        return (
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: 13, padding: "8px 14px", fontWeight: 800, background: "#16a34a" }}
            onClick={() => transitionStatus(o.id, "delivered")}
            disabled={isBusy}
          >
            {isBusy ? "Updating…" : "Mark Delivered ✅"}
          </button>
        );

      default:
        return null;
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>📦 Owner Order Management</h3>
        <button type="button" className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={loadOrders}>
          🔄 Refresh Orders
        </button>
      </div>

      {networkError && (
        <div style={{ background: "#fef3c7", color: "#92400e", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
          ⚠️ {networkError}
        </div>
      )}

      {/* SPRINT T5: Delivery Analytics Summary Bar */}
      <div className="dash-card" style={{ background: "#fffaf0", border: "1px solid #fde68a", padding: "10px 14px" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#78716c", alignItems: "center" }}>
          <span>⏱️ Avg Delivery Time: <b style={{ color: "#16a34a", fontSize: 13.5 }}>{avgDeliveryMin} mins</b></span>
          <span>🛵 Active Out for Delivery: <b style={{ color: "#d97706" }}>{orders.filter((o) => o.status === "out_for_delivery").length}</b></span>
          <span>⚠️ Late Deliveries: <b style={{ color: lateOrders.length > 0 ? "#dc2626" : "#16a34a" }}>{lateOrders.length}</b></span>
        </div>
      </div>

      {/* 2️⃣ Grouping Filter Chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className={`dash-tab ${activeFilter === "all" ? "active" : ""}`}
          style={{ fontSize: 12.5, padding: "6px 12px" }}
          onClick={() => setActiveFilter("all")}
        >
          All Orders ({orders.length})
        </button>
        <button
          type="button"
          className={`dash-tab ${activeFilter === "new" ? "active" : ""}`}
          style={{
            fontSize: 12.5,
            padding: "6px 12px",
            background: newOrders.length > 0 ? "#fef3c7" : undefined,
            color: newOrders.length > 0 ? "#92400e" : undefined,
            fontWeight: newOrders.length > 0 ? 800 : undefined,
          }}
          onClick={() => setActiveFilter("new")}
        >
          🔔 New / Needs Action ({newOrders.length})
        </button>
        <button
          type="button"
          className={`dash-tab ${activeFilter === "in_progress" ? "active" : ""}`}
          style={{ fontSize: 12.5, padding: "6px 12px" }}
          onClick={() => setActiveFilter("in_progress")}
        >
          🍳 In Progress ({inProgressOrders.length})
        </button>
        <button
          type="button"
          className={`dash-tab ${activeFilter === "completed" ? "active" : ""}`}
          style={{ fontSize: 12.5, padding: "6px 12px" }}
          onClick={() => setActiveFilter("completed")}
        >
          ✅ Completed ({completedOrders.length})
        </button>
      </div>

      {/* 3️⃣ Orders List */}
      {!displayOrders.length ? (
        <div className="dash-card" style={{ padding: 24, textAlign: "center", color: "#a8a29e", fontSize: 13 }}>
          Is filter mein koi order nahi mila.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayOrders.map((o) => {
            const canCancel = ["placed", "accepted", "preparing"].includes(o.status);

            // Time math helpers
            const createdTimeStr = new Date(o.createdAt).toLocaleTimeString("hi-IN", {
              hour: "2-digit",
              minute: "2-digit",
            });

            // Delivery Duration
            let deliveryDurationMin: number | null = null;
            if (o.acceptedAt && o.deliveredAt) {
              deliveryDurationMin = Math.round((o.deliveredAt - o.acceptedAt) / 60000);
            }

            // Late Flag Detector for out_for_delivery
            const isRunningLate =
              o.status === "out_for_delivery" &&
              o.estimatedWindowEnd &&
              now > o.estimatedWindowEnd;

            // ETA Window string
            let etaStr: string | null = null;
            if (o.estimatedWindowStart && o.estimatedWindowEnd) {
              const start = new Date(o.estimatedWindowStart).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const end = new Date(o.estimatedWindowEnd).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              etaStr = `${start} – ${end}`;
            }

            return (
              <div
                key={o.id}
                className="dash-card"
                style={{
                  borderLeft: isRunningLate
                    ? "4px solid #dc2626"
                    : o.status === "placed"
                    ? "4px solid #f59e0b"
                    : o.status === "cancelled"
                    ? "4px solid #dc2626"
                    : "4px solid #16a34a",
                }}
              >
                {/* Header: OrderNo & Status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                  <div>
                    <b style={{ fontSize: 16 }}>{o.orderNo}</b>
                    <span style={{ fontSize: 11.5, color: "#78716c", marginLeft: 8 }}>({createdTimeStr})</span>
                    {isRunningLate && (
                      <span style={{ fontSize: 10.5, background: "#fee2e2", color: "#dc2626", padding: "2px 6px", borderRadius: 4, fontWeight: 800, marginLeft: 8 }}>
                        ⚠️ RUNNING LATE
                      </span>
                    )}
                  </div>
                  {renderStatusBadge(o.status)}
                </div>

                {/* Customer Details */}
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", marginBottom: 4 }}>
                  👤 {o.customerName} · <a href={`tel:${o.customerPhone}`} style={{ color: "#d97706", textDecoration: "underline" }}>📞 {o.customerPhone}</a>
                </div>
                <div style={{ fontSize: 12, color: "#78716c", marginBottom: 8 }}>
                  📍 {o.address} {o.distanceKm ? `(${o.distanceKm} km)` : ""}
                </div>

                {/* Order Items */}
                <div style={{ background: "#fffaf0", padding: "8px 12px", borderRadius: 8, fontSize: 12.5, marginBottom: 8, border: "1px solid #f1e8dc" }}>
                  {o.items?.map((it, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                      <span>• {it.name} × {it.qty}</span>
                      <b>₹{it.price * it.qty}</b>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px dashed #e7e5e4", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 13 }}>
                    <span>Grand Total (Item ₹{o.itemTotal} + Delivery ₹{o.deliveryCharge})</span>
                    <span style={{ color: "#16a34a" }}>₹{o.grandTotal}</span>
                  </div>
                </div>

                {/* ETA & Duration Metrics */}
                <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: "#78716c", flexWrap: "wrap", marginBottom: 10 }}>
                  {etaStr && (
                    <span>⏳ Estimated Arrival: <b>{etaStr}</b></span>
                  )}
                  {deliveryDurationMin !== null && (
                    <span>⏱️ Total Duration: <b>{deliveryDurationMin} mins</b></span>
                  )}
                  {o.cancellationReason && (
                    <span style={{ color: "#dc2626" }}>Reason: <i>"{o.cancellationReason}"</i></span>
                  )}
                </div>

                {/* Action Bar: Single Valid Button + Optional Cancel Button */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", paddingTop: 6, borderTop: "1px solid #f3f4f6" }}>
                  {renderActionButton(o)}

                  {canCancel && (
                    <button
                      type="button"
                      className="dash-mini"
                      style={{ background: "#fee2e2", color: "#dc2626", fontWeight: 700, padding: "7px 12px" }}
                      onClick={() => {
                        setCancellingOrder(o);
                        setCancelReason("");
                        setCancelError("");
                      }}
                      disabled={processingId === o.id}
                    >
                      ❌ Cancel Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4️⃣ Mandatory Cancellation Dialog Modal */}
      {cancellingOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
          <div className="dash-card" style={{ maxWidth: 440, width: "100%", background: "#ffffff", padding: 20, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: "#dc2626", marginBottom: 6 }}>
              ❌ Cancel Order {cancellingOrder.orderNo}
            </h3>
            <p style={{ fontSize: 12.5, color: "#78716c", marginBottom: 12 }}>
              Are you sure you want to cancel this order? A mandatory reason must be provided and will be visible to the customer.
            </p>

            {/* Quick Reason Preset Buttons */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {["Item Out of Stock", "Kitchen Overloaded", "Customer Requested", "Address Too Far"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  style={{ fontSize: 11, background: "#f3f4f6", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
                  onClick={() => setCancelReason(preset)}
                >
                  + {preset}
                </button>
              ))}
            </div>

            <textarea
              className="dash-input"
              style={{ width: "100%", height: 80, fontSize: 13, padding: 8, borderRadius: 8, marginBottom: 8 }}
              placeholder="Enter mandatory cancellation reason…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />

            {cancelError && (
              <div style={{ color: "#dc2626", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                {cancelError}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: 12.5 }}
                onClick={() => setCancellingOrder(null)}
              >
                Go Back
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: 12.5, background: "#dc2626" }}
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🛵 Order Tracking Server Engine — Sprint T1 Foundation
// Specification: Gangaram-Order-Tracking-Engineering-Spec.md

import { OrderStatus, StatusActor, StatusHistoryEntry } from "@/lib/types";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { validateTransition } from "@/lib/tracking-constants";

export * from "@/lib/tracking-constants";

export interface ExecuteTransitionParams {
  orderId: string;
  targetStatus: OrderStatus;
  actor: StatusActor;
  reason?: string;
  deliveryProofNote?: string;
  deliveryProofPhotoRef?: string;
}

/**
 * Server-Side Atomic State Transition Execution.
 * Runs in a Firestore Transaction to guarantee that transition checks evaluate against
 * fresh, authoritative server data and that field mutations occur atomically.
 */
export async function executeOrderTransitionServer(params: ExecuteTransitionParams) {
  const { orderId, targetStatus, actor, reason, deliveryProofNote, deliveryProofPhotoRef } = params;
  const orderRef = adminDb.collection("orders").doc(orderId);

  return await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) {
      throw new Error(`Order '${orderId}' not found.`);
    }

    const data = snap.data();
    const currentStatus: OrderStatus = data?.status || "placed";

    // Validate Transition against Server State
    const val = validateTransition(currentStatus, targetStatus, actor, reason);
    if (!val.valid) {
      throw new Error(val.error || "Invalid status transition.");
    }

    // Handle Idempotent Re-execution (No-op)
    if (val.idempotent) {
      return {
        ok: true,
        idempotent: true,
        orderId,
        status: currentStatus,
        message: `Order is already in state '${currentStatus}'. No action taken.`,
      };
    }

    const now = Date.now();
    const historyEntry: StatusHistoryEntry = {
      stage: targetStatus,
      timestamp: now,
      actor,
      note: reason || deliveryProofNote || null,
    };

    const updates: Record<string, any> = {
      status: targetStatus,
      statusHistory: FieldValue.arrayUnion(historyEntry),
    };

    // Specific Timestamp & Data Field Calculations
    if (targetStatus === "accepted") {
      updates.acceptedAt = now;
      // Default 30–45 min estimated delivery window
      updates.estimatedWindowStart = now + 30 * 60 * 1000;
      updates.estimatedWindowEnd = now + 45 * 60 * 1000;
    } else if (targetStatus === "delivered") {
      updates.deliveredAt = now;
      if (deliveryProofNote) updates.deliveryProofNote = deliveryProofNote.trim();
      if (deliveryProofPhotoRef) updates.deliveryProofPhotoRef = deliveryProofPhotoRef.trim();
    } else if (targetStatus === "customer_confirmed") {
      updates.confirmedAt = now;
      updates.confirmedBy = actor === "system" ? "auto" : "customer";
    } else if (targetStatus === "cancelled") {
      updates.cancellationReason = reason?.trim() || "Cancelled by restaurant owner";
    }

    tx.update(orderRef, updates);

    return {
      ok: true,
      idempotent: false,
      orderId,
      previousStatus: currentStatus,
      status: targetStatus,
      timestamp: now,
    };
  });
}

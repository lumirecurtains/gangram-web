// 🛵 Order Tracking Constants & State Machine Matrix — Client & Server Safe
// Specification: Gangaram-Order-Tracking-Engineering-Spec.md

import { OrderStatus, StatusActor } from "@/lib/types";

export const ORDER_STAGES: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "packed",
  "out_for_delivery",
  "delivered",
  "customer_confirmed",
  "review_completed",
];

export const TERMINAL_STAGES: OrderStatus[] = [
  "cancelled",
  "review_completed",
];

export const STAGE_MESSAGES: Record<OrderStatus, string> = {
  placed: "Order received! Gangaram Dairy has your order.",
  accepted: "Your order has been accepted! Gangaram Dairy is getting started.",
  preparing: "Your food is being prepared with care 🍳",
  packed: "Your order is packed and ready to go!",
  out_for_delivery: "Your order is on its way! 🛵",
  delivered: "Your order has arrived — enjoy your meal! 🎉",
  customer_confirmed: "Thank you for confirming receipt!",
  review_completed: "Thank you for your feedback! 🙏",
  cancelled: "Order Cancelled",
};

export interface TransitionValidationResult {
  valid: boolean;
  idempotent: boolean;
  error?: string;
}

/**
 * Validates whether a status transition is permitted according to the official state machine.
 * Enforces forward-only progression, actor authorization, cancellation rules, and idempotency.
 */
export function validateTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  actor: StatusActor,
  reason?: string
): TransitionValidationResult {
  // 1. Idempotency Check: Same-state transition is a safe no-op
  if (currentStatus === targetStatus) {
    return { valid: true, idempotent: true };
  }

  // 2. Terminal state check: No transitions permitted out of terminal states
  if (TERMINAL_STAGES.includes(currentStatus)) {
    return {
      valid: false,
      idempotent: false,
      error: `Order is in terminal state '${currentStatus}' and cannot be modified.`,
    };
  }

  // 3. Cancellation Rule Check
  if (targetStatus === "cancelled") {
    const cancellableStates: OrderStatus[] = ["placed", "accepted", "preparing"];
    if (!cancellableStates.includes(currentStatus)) {
      return {
        valid: false,
        idempotent: false,
        error: `Order cannot be cancelled once food is packed or dispatched (current: '${currentStatus}').`,
      };
    }
    if (actor !== "owner") {
      return {
        valid: false,
        idempotent: false,
        error: "Cancellation can only be performed by the restaurant owner.",
      };
    }
    if (!reason || !reason.trim()) {
      return {
        valid: false,
        idempotent: false,
        error: "Cancellation requires a non-empty reason.",
      };
    }
    return { valid: true, idempotent: false };
  }

  // 4. Strict Forward Progression Map
  const allowedForwardNext: Record<OrderStatus, { next: OrderStatus; allowedActors: StatusActor[] }> = {
    placed: { next: "accepted", allowedActors: ["owner"] },
    accepted: { next: "preparing", allowedActors: ["owner"] },
    preparing: { next: "packed", allowedActors: ["owner"] },
    packed: { next: "out_for_delivery", allowedActors: ["owner"] },
    out_for_delivery: { next: "delivered", allowedActors: ["owner"] },
    delivered: { next: "customer_confirmed", allowedActors: ["customer", "system"] },
    customer_confirmed: { next: "review_completed", allowedActors: ["customer"] },
    review_completed: { next: "review_completed", allowedActors: [] },
    cancelled: { next: "cancelled", allowedActors: [] },
  };

  const rule = allowedForwardNext[currentStatus];
  if (!rule || rule.next !== targetStatus) {
    return {
      valid: false,
      idempotent: false,
      error: `Invalid transition: cannot move directly from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  if (!rule.allowedActors.includes(actor)) {
    return {
      valid: false,
      idempotent: false,
      error: `Actor '${actor}' is not authorized to transition order from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  return { valid: true, idempotent: false };
}

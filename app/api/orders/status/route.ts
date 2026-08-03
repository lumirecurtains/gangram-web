// 📦 /api/orders/status — POST: Execute Server-side Order Status Transition
// Sprint T1 Engineering Foundation: Atomic, Idempotent, State Machine Validation

import { NextResponse } from "next/server";
import { verifyOwner, ownerError } from "@/lib/apiAuth";
import { executeOrderTransitionServer } from "@/lib/tracking";
import { OrderStatus, StatusActor } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      targetStatus,
      reason,
      actor: requestedActor,
      deliveryProofNote,
      deliveryProofPhotoRef,
    } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    if (!targetStatus || typeof targetStatus !== "string") {
      return NextResponse.json({ error: "targetStatus required" }, { status: 400 });
    }

    let actor: StatusActor = requestedActor || "owner";

    // Enforce Authorization by Actor / Target Status
    const ownerOnlyStatuses: OrderStatus[] = [
      "accepted",
      "preparing",
      "packed",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (ownerOnlyStatuses.includes(targetStatus as OrderStatus) || actor === "owner") {
      try {
        await verifyOwner(req);
        actor = "owner";
      } catch (authErr: any) {
        return ownerError(authErr);
      }
    } else if (targetStatus === "customer_confirmed") {
      actor = requestedActor === "system" ? "system" : "customer";
    }

    const result = await executeOrderTransitionServer({
      orderId,
      targetStatus: targetStatus as OrderStatus,
      actor,
      reason,
      deliveryProofNote,
      deliveryProofPhotoRef,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Status transition API error:", e);
    return NextResponse.json({ error: e?.message || "Transition execution failed" }, { status: 400 });
  }
}

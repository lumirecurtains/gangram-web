// 📦 /api/orders/status — POST: Execute Server-side Order Status Transition
// Security Hardening: Strict Fail-Closed Actor Authorization (No client "system" spoofing allowed)

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
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
      idToken,
    } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    if (!targetStatus || typeof targetStatus !== "string") {
      return NextResponse.json({ error: "targetStatus required" }, { status: 400 });
    }

    const ownerOnlyStatuses: OrderStatus[] = [
      "accepted",
      "preparing",
      "packed",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    const customerStatuses: OrderStatus[] = [
      "customer_confirmed",
      "review_completed",
    ];

    // Client requests can NEVER claim "system" actor via public HTTP API
    if (requestedActor === "system") {
      return NextResponse.json(
        { error: "System actor cannot be claimed by client requests" },
        { status: 403 }
      );
    }

    let actor: StatusActor = "customer";

    // 1️⃣ Owner Statuses: Strictly require verifyOwner token
    if (ownerOnlyStatuses.includes(targetStatus as OrderStatus) || requestedActor === "owner") {
      try {
        await verifyOwner(req);
        actor = "owner";
      } catch (authErr: any) {
        return ownerError(authErr);
      }
    }
    // 2️⃣ Customer Statuses (customer_confirmed, review_completed)
    else if (customerStatuses.includes(targetStatus as OrderStatus)) {
      if (requestedActor === "owner") {
        try {
          await verifyOwner(req);
          actor = "owner";
        } catch (authErr: any) {
          return ownerError(authErr);
        }
      } else {
        // Customer Status Transition: Require valid Firebase Phone Auth Token (Fail Closed)
        const authHeader = req.headers.get("Authorization");
        const token = idToken || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

        if (!token) {
          return NextResponse.json(
            { error: "Customer status transition requires phone OTP token verification" },
            { status: 401 }
          );
        }

        let decoded;
        try {
          decoded = await adminAuth.verifyIdToken(token);
        } catch (tokenErr) {
          console.warn("Status transition customer token verification failure:", tokenErr);
          return NextResponse.json(
            { error: "Invalid or expired phone OTP verification token" },
            { status: 401 }
          );
        }

        const verifiedPhone = decoded.phone_number ? decoded.phone_number.replace("+91", "").trim() : "";
        const orderSnap = await adminDb.collection("orders").doc(orderId).get();
        if (!orderSnap.exists) {
          return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const orderData = orderSnap.data();
        const orderPhone = String(orderData?.customerPhone || "").replace("+91", "").trim();

        if (!verifiedPhone || !orderPhone || verifiedPhone !== orderPhone) {
          return NextResponse.json(
            { error: "Verified phone does not match order customer phone" },
            { status: 403 }
          );
        }

        actor = "customer";
      }
    }
    // 3️⃣ Default Deny: Reject unhandled target statuses
    else {
      return NextResponse.json({ error: "Unauthorized status transition target" }, { status: 403 });
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

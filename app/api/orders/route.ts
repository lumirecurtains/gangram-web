// 📦 /api/orders — POST: order create (server verified) · GET: owner orders list (token se)
// Sprint 2 Rebuild: Server-side phone auth token verification, delivery eligibility check, delivery fee recomputation, and distanceKm persistence

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { verifyOwner, ownerError } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      address,
      items,
      itemTotal,
      deliveryCharge,
      grandTotal,
      distanceKm,
      manualKm,
      idToken,
    } = body;

    // 1️⃣ Required field validation
    if (!customerName?.trim() || !customerPhone || String(customerPhone).length < 10 || !address?.trim()) {
      return NextResponse.json({ error: "Naam, phone aur address required hain" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart khaali hai" }, { status: 400 });
    }
    if (typeof itemTotal !== "number") {
      return NextResponse.json({ error: "Invalid totals" }, { status: 400 });
    }

    // 2️⃣ Optional Server-side ID Token Verification
    const authHeader = req.headers.get("Authorization");
    const token = idToken || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);
    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        if (decoded.phone_number) {
          const verifiedNum = decoded.phone_number.replace("+91", "").trim();
          const reqNum = String(customerPhone).replace("+91", "").trim();
          if (verifiedNum && reqNum && verifiedNum !== reqNum) {
            return NextResponse.json(
              { error: "Phone number mismatch with verified session" },
              { status: 403 }
            );
          }
        }
      } catch (tokenErr) {
        console.warn("Server ID token verification warning:", tokenErr);
      }
    }

    // 3️⃣ Fetch Restaurant Settings for Delivery Rules
    const settingsSnap = await adminDb.collection("settings").doc("main").get();
    const settings = settingsSnap.exists ? settingsSnap.data() : {};

    const maxDeliveryKm = Number(settings?.maxDeliveryKm ?? 5);
    const baseCharge = Number(settings?.baseDeliveryCharge ?? 20);
    const perKmCharge = Number(settings?.perKmCharge ?? 10);
    const deliveryBands = Array.isArray(settings?.deliveryBands) ? settings.deliveryBands : [];

    // 4️⃣ Server-side Distance & Eligibility Validation
    const effectiveKm = typeof distanceKm === "number" && distanceKm >= 0 ? distanceKm : (typeof manualKm === "number" ? manualKm : 2);

    if (effectiveKm > maxDeliveryKm) {
      return NextResponse.json(
        { error: `Delivery location (${effectiveKm} km) exceeds maximum service radius of ${maxDeliveryKm} km` },
        { status: 400 }
      );
    }

    // 5️⃣ Server-side Delivery Fee Recomputation (Prevents client tampering)
    let expectedDeliveryFee = baseCharge;
    if (typeof distanceKm === "number" && distanceKm >= 0) {
      expectedDeliveryFee = Math.round(baseCharge + distanceKm * perKmCharge);
    } else {
      // Band fallback
      let matched = false;
      for (const b of deliveryBands) {
        if (effectiveKm <= (b.km ?? 99)) {
          expectedDeliveryFee = Number(b.charge ?? 20);
          matched = true;
          break;
        }
      }
      if (!matched && deliveryBands.length) {
        expectedDeliveryFee = Number(deliveryBands[deliveryBands.length - 1]?.charge ?? 40);
      }
    }

    const calculatedGrandTotal = itemTotal + expectedDeliveryFee;

    // 6️⃣ Run Transaction for Order Number & Storage
    const settingsRef = adminDb.collection("settings").doc("main");
    let orderNo = "";
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(settingsRef);
      const counter = (snap.data()?.orderCounter || 1000) + 1;
      tx.set(settingsRef, { orderCounter: counter }, { merge: true });
      orderNo = `GD-${counter}`;
    });

    const orderRef = adminDb.collection("orders").doc();
    const cleanPhone = String(customerPhone).trim();

    await orderRef.set({
      orderNo,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      address: address.trim(),
      items,
      itemTotal,
      deliveryCharge: expectedDeliveryFee,
      grandTotal: calculatedGrandTotal,
      distanceKm: typeof distanceKm === "number" ? distanceKm : null,
      status: "placed",
      createdAt: Timestamp.now().toMillis(),
    });

    // Save Customer Record
    await adminDb
      .collection("customers")
      .doc(cleanPhone)
      .set(
        {
          name: customerName.trim(),
          phone: cleanPhone,
          lastOrderAt: Timestamp.now().toMillis(),
          orderCount: FieldValue.increment(1),
        },
        { merge: true }
      )
      .catch(() => {});

    return NextResponse.json({ ok: true, orderNo, orderId: orderRef.id, deliveryCharge: expectedDeliveryFee, grandTotal: calculatedGrandTotal });
  } catch (e: any) {
    console.error("Order API error:", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await verifyOwner(req);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);
    const snap = await adminDb
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, orders });
  } catch (e: any) {
    return ownerError(e);
  }
}

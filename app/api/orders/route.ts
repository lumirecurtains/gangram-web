// 📦 /api/orders — POST: order create (server verified) · GET: owner orders list (token se)
// Security Sprint S1: Mandatory Server-side Firebase Phone OTP Verification (C-1) & Server-side Item Price Tampering Validation (C-2)

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { verifyOwner, ownerError } from "@/lib/apiAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Rate Limiting Enforcement (Sprint S3 M-1)
  const rl = checkRateLimit(req, "orders_post", { intervalMs: 60 * 1000, maxRequests: 10 });
  if (!rl.success && rl.response) return rl.response;

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
    if (typeof itemTotal !== "number" || typeof deliveryCharge !== "number" || typeof grandTotal !== "number") {
      return NextResponse.json({ error: "Invalid totals" }, { status: 400 });
    }

    // 2️⃣ C-1: Mandatory Server-Side Firebase Phone OTP Verification (Fail Closed)
    const authHeader = req.headers.get("Authorization");
    const token = idToken || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

    if (!token) {
      return NextResponse.json(
        { error: "Phone OTP verification failure. Please verify your phone number via OTP before ordering." },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authErr) {
      console.warn("Server ID token verification failure:", authErr);
      return NextResponse.json(
        { error: "Phone OTP verification failure. Please verify your phone number via OTP before ordering." },
        { status: 401 }
      );
    }

    const verifiedNum = decodedToken.phone_number
      ? decodedToken.phone_number.replace("+91", "").trim()
      : "";
    const reqNum = String(customerPhone).replace("+91", "").trim();

    if (!verifiedNum || !reqNum || verifiedNum !== reqNum) {
      return NextResponse.json(
        { error: "Verified phone number does not match order customer phone." },
        { status: 403 }
      );
    }

    // 3️⃣ C-2: Server-Side Item Price Validation (Fetch trusted prices from Firestore)
    let calculatedItemTotal = 0;
    const validatedItems = [];

    for (const it of items) {
      const itemId = String(it.itemId || it.id || "");
      const qty = Number(it.qty) || 1;

      if (!itemId) {
        return NextResponse.json({ error: "Invalid item in cart" }, { status: 400 });
      }

      const itemSnap = await adminDb.collection("menuItems").doc(itemId).get();
      if (!itemSnap.exists) {
        return NextResponse.json({ error: `Item '${it.name || itemId}' is no longer available.` }, { status: 400 });
      }

      const menuItemData = itemSnap.data();
      const trustedPrice = Number(menuItemData?.price);

      if (isNaN(trustedPrice) || trustedPrice < 0) {
        return NextResponse.json({ error: `Invalid pricing for item '${it.name}'.` }, { status: 400 });
      }

      if (menuItemData?.available === false) {
        return NextResponse.json({ error: `Item '${menuItemData.name || it.name}' is sold out.` }, { status: 400 });
      }

      calculatedItemTotal += trustedPrice * qty;
      validatedItems.push({
        itemId,
        name: menuItemData?.name || it.name,
        price: trustedPrice,
        qty,
      });
    }

    // 4️⃣ Fetch Restaurant Settings for Delivery Rules
    const settingsSnap = await adminDb.collection("settings").doc("main").get();
    const settings = settingsSnap.exists ? settingsSnap.data() : {};

    const maxDeliveryKm = Number(settings?.maxDeliveryKm ?? 5);
    const baseCharge = Number(settings?.baseDeliveryCharge ?? 20);
    const perKmCharge = Number(settings?.perKmCharge ?? 10);
    const deliveryBands = Array.isArray(settings?.deliveryBands) ? settings.deliveryBands : [];

    // 5️⃣ Server-side Distance & Eligibility Validation
    const effectiveKm = typeof distanceKm === "number" && distanceKm >= 0 ? distanceKm : (typeof manualKm === "number" ? manualKm : 2);

    if (effectiveKm > maxDeliveryKm) {
      return NextResponse.json(
        { error: `Delivery location (${effectiveKm} km) exceeds maximum service radius of ${maxDeliveryKm} km` },
        { status: 400 }
      );
    }

    // 6️⃣ Server-side Delivery Fee Recomputation
    let expectedDeliveryFee = baseCharge;
    if (typeof distanceKm === "number" && distanceKm >= 0) {
      expectedDeliveryFee = Math.round(baseCharge + distanceKm * perKmCharge);
    } else {
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

    const calculatedGrandTotal = calculatedItemTotal + expectedDeliveryFee;

    // 7️⃣ Price Tampering Mismatch Enforcement (Fail Closed)
    const itemTotalDiff = Math.abs(itemTotal - calculatedItemTotal);
    const deliveryDiff = Math.abs(deliveryCharge - expectedDeliveryFee);
    const grandTotalDiff = Math.abs(grandTotal - calculatedGrandTotal);

    if (itemTotalDiff > 0.01 || deliveryDiff > 0.01 || grandTotalDiff > 0.01) {
      return NextResponse.json(
        { error: "Order calculation mismatch. Please refresh cart and try again." },
        { status: 400 }
      );
    }

    // 8️⃣ Run Transaction for Order Number & Storage
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
    const now = Timestamp.now().toMillis();

    const initialHistoryEntry = {
      stage: "placed",
      timestamp: now,
      actor: "system",
      note: "Order received",
    };

    await orderRef.set({
      orderNo,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      address: address.trim(),
      items: validatedItems,
      itemTotal: calculatedItemTotal,
      deliveryCharge: expectedDeliveryFee,
      grandTotal: calculatedGrandTotal,
      distanceKm: typeof distanceKm === "number" ? distanceKm : null,
      status: "placed",
      statusHistory: [initialHistoryEntry],
      estimatedWindowStart: null,
      estimatedWindowEnd: null,
      acceptedAt: null,
      deliveredAt: null,
      confirmedAt: null,
      confirmedBy: null,
      cancellationReason: null,
      deliveryProofNote: null,
      deliveryProofPhotoRef: null,
      createdAt: now,
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

    // Increment Product Intelligence Orders Count
    if (Array.isArray(validatedItems)) {
      for (const it of validatedItems) {
        if (it?.itemId) {
          await adminDb
            .collection("menuItems")
            .doc(String(it.itemId))
            .set({ ordersCount: FieldValue.increment(Number(it.qty) || 1) }, { merge: true })
            .catch(() => {});
        }
      }
    }

    return NextResponse.json({
      ok: true,
      orderNo,
      orderId: orderRef.id,
      deliveryCharge: expectedDeliveryFee,
      grandTotal: calculatedGrandTotal,
    });
  } catch (e: any) {
    console.error("Order API error:", e);
    return NextResponse.json({ error: "Internal order processing error" }, { status: 500 });
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

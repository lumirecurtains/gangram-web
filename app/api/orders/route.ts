// 📦 POST /api/orders — order create (server-side, admin SDK se)
// Order number generate + Firestore mein save (rules strict reh sakti hain)

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, customerPhone, address, items, itemTotal, deliveryCharge, grandTotal } = body;

    // Basic validation
    if (!customerName?.trim() || !customerPhone || String(customerPhone).length < 10 || !address?.trim()) {
      return NextResponse.json({ error: "Naam, phone aur address chahiye" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart khaali hai" }, { status: 400 });
    }
    if (typeof itemTotal !== "number" || typeof grandTotal !== "number") {
      return NextResponse.json({ error: "Invalid totals" }, { status: 400 });
    }

    // Order number — settings/main mein counter (transaction se safe)
    const settingsRef = adminDb.collection("settings").doc("main");
    let orderNo = "";
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(settingsRef);
      const counter = (snap.data()?.orderCounter || 1000) + 1;
      tx.set(settingsRef, { orderCounter: counter }, { merge: true });
      orderNo = `GD-${counter}`;
    });

    // Order doc
    const orderRef = adminDb.collection("orders").doc();
    await orderRef.set({
      orderNo,
      customerName: customerName.trim(),
      customerPhone: String(customerPhone).trim(),
      address: address.trim(),
      items,
      itemTotal,
      deliveryCharge,
      grandTotal,
      status: "placed",
      createdAt: Timestamp.now().toMillis(),
    });

    return NextResponse.json({ ok: true, orderNo, orderId: orderRef.id });
  } catch (e: any) {
    console.error("Order error:", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

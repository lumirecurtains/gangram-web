// 📦 /api/orders — POST: order create (server) · GET: owner orders list (token se)

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { verifyOwner, ownerError } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, customerPhone, address, items, itemTotal, deliveryCharge, grandTotal } = body;

    if (!customerName?.trim() || !customerPhone || String(customerPhone).length < 10 || !address?.trim()) {
      return NextResponse.json({ error: "Naam, phone aur address chahiye" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart khaali hai" }, { status: 400 });
    }
    if (typeof itemTotal !== "number" || typeof grandTotal !== "number") {
      return NextResponse.json({ error: "Invalid totals" }, { status: 400 });
    }

    const settingsRef = adminDb.collection("settings").doc("main");
    let orderNo = "";
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(settingsRef);
      const counter = (snap.data()?.orderCounter || 1000) + 1;
      tx.set(settingsRef, { orderCounter: counter }, { merge: true });
      orderNo = `GD-${counter}`;
    });

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

    // Customer record (regulars ke liye — light)
    await adminDb.collection("customers").doc(String(customerPhone).trim()).set(
      { name: customerName.trim(), lastOrderAt: Timestamp.now().toMillis(), orderCount: FieldValue.increment(1) },
      { merge: true }
    ).catch(() => {});

    return NextResponse.json({ ok: true, orderNo, orderId: orderRef.id });
  } catch (e: any) {
    console.error("Order error:", e);
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

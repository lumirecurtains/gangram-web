// 📜 /api/orders/history — customer ki apni orders (phone se, bina login)
// PRD: phone-based identity — no full account system

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = (searchParams.get("phone") || "").trim();
    if (phone.length < 10) {
      return NextResponse.json({ error: "Phone number chahiye (10+ digits)" }, { status: 400 });
    }
    const snap = await adminDb
      .collection("orders")
      .where("customerPhone", "==", phone)
      .limit(30)
      .get();
    const orders = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 20);
    return NextResponse.json({ ok: true, orders });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}

// 📜 /api/orders/history — customer ki apni orders (phone se, bina login)
// PRD: phone-based identity — no full account system

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

import { executeOrderTransitionServer } from "@/lib/tracking";

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

    const now = Date.now();
    const AUTO_CONFIRM_WINDOW_MS = 4 * 3600 * 1000; // 4 Hours

    const orders = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        let status = data.status || "placed";

        // Auto-confirmation fallback for delivered orders past 4 hours
        if (status === "delivered") {
          const deliveredTime = data.deliveredAt || data.createdAt || now;
          if (now - deliveredTime >= AUTO_CONFIRM_WINDOW_MS) {
            try {
              await executeOrderTransitionServer({
                orderId: d.id,
                targetStatus: "customer_confirmed",
                actor: "system",
              });
              status = "customer_confirmed";
            } catch (autoErr) {
              console.warn("Auto-confirm sweep notice:", autoErr);
            }
          }
        }

        return { id: d.id, ...data, status };
      })
    );

    const sorted = orders
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 20);

    return NextResponse.json({ ok: true, orders: sorted });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}

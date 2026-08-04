// 📜 /api/orders/history — customer order history (server verified)
// Security Sprint S2: Session-scoped ID Token verification required for Order History Access (C-3)

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { executeOrderTransitionServer } from "@/lib/tracking";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Rate Limiting Enforcement (Sprint S3 M-1)
  const rl = checkRateLimit(req, "orders_history_get", { intervalMs: 60 * 1000, maxRequests: 20 });
  if (!rl.success && rl.response) return rl.response;

  try {
    const { searchParams } = new URL(req.url);
    const phone = (searchParams.get("phone") || "").trim();
    if (phone.length < 10) {
      return NextResponse.json({ error: "Phone number required (10+ digits)" }, { status: 400 });
    }

    // C-3: Session-scoped ID Token verification for Order History Access (Fail Closed)
    const authHeader = req.headers.get("Authorization");
    const idTokenParam = searchParams.get("idToken") || searchParams.get("token");
    const token = idTokenParam || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

    if (!token) {
      return NextResponse.json(
        { error: "Order history access requires valid phone OTP verification." },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authErr) {
      console.warn("Order history token verification failure:", authErr);
      return NextResponse.json(
        { error: "Order history access requires valid phone OTP verification." },
        { status: 401 }
      );
    }

    const verifiedNum = decodedToken.phone_number
      ? decodedToken.phone_number.replace("+91", "").trim()
      : "";
    const reqNum = String(phone).replace("+91", "").trim();

    if (!verifiedNum || !reqNum || verifiedNum !== reqNum) {
      return NextResponse.json(
        { error: "Verified session phone number does not match requested phone number." },
        { status: 403 }
      );
    }

    const snap = await adminDb
      .collection("orders")
      .where("customerPhone", "==", reqNum)
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
    return NextResponse.json({ error: "Internal error processing order history" }, { status: 500 });
  }
}

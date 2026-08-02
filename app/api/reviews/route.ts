// ⭐ /api/reviews — POST: review create (server validate) · GET: public reviews
// Owner moderate: /api/reviews?action=hide|show (token se)

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { verifyOwner, ownerError } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Index-free: sab recent reviews lao, filter+sort client-side
    const snap = await adminDb.collection("reviews").limit(50).get();
    const reviews = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r: any) => !r.hidden)
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 20);
    return NextResponse.json({ ok: true, reviews });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, rating, text } = body;
    if (!name?.trim() || !phone || String(phone).length < 10) {
      return NextResponse.json({ error: "Naam aur phone chahiye" }, { status: 400 });
    }
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: "Rating 1-5 ke beech chahiye" }, { status: 400 });
    }
    if (!text?.trim() || text.trim().length < 3) {
      return NextResponse.json({ error: "Thodi si review likho" }, { status: 400 });
    }
    const ref = adminDb.collection("reviews").doc();
    await ref.set({
      name: name.trim(),
      phone: String(phone).trim(),
      rating: r,
      text: text.trim(),
      hidden: false,
      createdAt: Timestamp.now().toMillis(),
    });
    return NextResponse.json({ ok: true, reviewId: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}

// Owner moderation: PATCH /api/reviews { id, hidden }
export async function PATCH(req: Request) {
  try {
    await verifyOwner(req);
    const body = await req.json();
    if (!body.id || typeof body.hidden !== "boolean") {
      return NextResponse.json({ error: "id aur hidden chahiye" }, { status: 400 });
    }
    await adminDb.collection("reviews").doc(body.id).update({ hidden: body.hidden });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return ownerError(e);
  }
}

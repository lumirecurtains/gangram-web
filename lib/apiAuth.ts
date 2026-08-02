// 🔐 Server-side owner verification — Firebase ID token + settings.ownerEmails check

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export async function verifyOwner(req: Request): Promise<string> {
  const h = req.headers.get("authorization");
  if (!h || !h.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = h.slice(7);
  const decoded = await adminAuth.verifyIdToken(token);
  const email = (decoded.email || "").toLowerCase();
  if (!email) throw new Error("No email on token");
  const snap = await adminDb.collection("settings").doc("main").get();
  const emails = ((snap.data()?.ownerEmails || []) as string[]).map((e) => e.toLowerCase());
  if (!emails.includes(email)) throw new Error("Not an owner");
  return email;
}

export function ownerError(e: any) {
  const msg = e?.message || "Error";
  const status = msg.includes("Unauthorized") || msg.includes("Not an owner") ? 403 : 500;
  return NextResponse.json({ error: msg }, { status });
}

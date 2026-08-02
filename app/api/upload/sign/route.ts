// ☁️ /api/upload/sign — Cloudinary signed upload signature (owner token se)
// Client is signature ke saath seedha Cloudinary pe upload karta hai

import { NextResponse } from "next/server";
import { getUploadSignature } from "@/lib/cloudinary";
import { verifyOwner, ownerError } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await verifyOwner(req);
    const timestamp = Math.round(Date.now() / 1000);
    return NextResponse.json({ ok: true, ...getUploadSignature(timestamp) });
  } catch (e: any) {
    return ownerError(e);
  }
}

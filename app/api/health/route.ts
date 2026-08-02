// 🔌 Health check API — Firebase Admin + Cloudinary connection verify
// Step 1 test ke liye. Secrets kabhi expose nahi hote.

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, string> = {};

  // 1) Firebase Admin — Firestore ping (server-side, service account se)
  try {
    await adminDb.collection("_health").doc("ping").get();
    results.firebaseAdmin = "✅ connected (Firestore read OK)";
  } catch (e: any) {
    results.firebaseAdmin = "❌ ERROR: " + (e?.message || e);
  }

  // 2) Cloudinary — API ping
  try {
    const info: any = await cloudinary.api.ping();
    results.cloudinary = "✅ connected (ping: " + (info?.message || "pong") + ")";
  } catch (e: any) {
    results.cloudinary = "❌ ERROR: " + (e?.message || e);
  }

  // 3) Env vars presence check (values nahi, sirf haan/nahi)
  const envs = {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    cloudName: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    cloudinaryKey: !!process.env.CLOUDINARY_API_KEY,
    cloudinarySecret: !!process.env.CLOUDINARY_API_SECRET,
    whatsapp: !!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    serviceAccountFile: !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  };
  results.envVars = Object.entries(envs)
    .map(([k, v]) => `${k}: ${v ? "✅" : "❌"}`)
    .join(" | ");

  const allOk = !results.firebaseAdmin.startsWith("❌") && !results.cloudinary.startsWith("❌");

  return NextResponse.json(
    {
      ok: allOk,
      time: new Date().toISOString(),
      project: "gangaram-web",
      results,
    },
    { status: allOk ? 200 : 500 }
  );
}

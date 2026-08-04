// 🔌 Health check API — operational status check
// Security Sprint S3: Rate-limited, sanitized status endpoint (M-4)

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Rate Limiting Enforcement (Sprint S3 M-1 & M-4)
  const rl = checkRateLimit(req, "health_get", { intervalMs: 60 * 1000, maxRequests: 30 });
  if (!rl.success && rl.response) return rl.response;

  try {
    // Lightweight server check
    await adminDb.collection("_health").doc("ping").get();

    return NextResponse.json({
      status: "ok",
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json(
      { status: "service_degraded", timestamp: Date.now() },
      { status: 503 }
    );
  }
}

// 🛡️ Sliding Window Rate Limiter for Next.js API Routes (Sprint S3 Security Hardening)

import { NextResponse } from "next/server";

interface RateLimitConfig {
  intervalMs: number;
  maxRequests: number;
}

const tracker = new Map<string, number[]>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export function checkRateLimit(
  req: Request,
  routeKey: string,
  config: RateLimitConfig
): { success: boolean; response?: NextResponse } {
  const ip = getClientIp(req);
  const key = `${routeKey}:${ip}`;
  const now = Date.now();
  const windowStart = now - config.intervalMs;

  const timestamps = tracker.get(key) || [];
  const validTimestamps = timestamps.filter((ts) => ts > windowStart);

  if (validTimestamps.length >= config.maxRequests) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      ),
    };
  }

  validTimestamps.push(now);
  tracker.set(key, validTimestamps);

  // Periodic cleanup to prevent memory growth
  if (tracker.size > 2000) {
    for (const [k, v] of tracker.entries()) {
      if (v.every((ts) => ts <= windowStart)) {
        tracker.delete(k);
      }
    }
  }

  return { success: true };
}

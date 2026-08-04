// 🔥 Firebase ADMIN SDK — server-side ke liye (secret)
// Service account JSON se chalta hai — sirf server pe use karo, kabhi browser mein NAHI

import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

function getServiceAccount() {
  const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (envKey) {
    try {
      const parsed = JSON.parse(envKey);
      if (parsed.private_key && typeof parsed.private_key === "string") {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed;
    } catch (e: any) {
      console.error("FIREBASE_SERVICE_ACCOUNT_KEY JSON parse error:", e);
      throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON in environment: ${e.message}`);
    }
  }

  const rel = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";
  const abs = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(abs)) {
    throw new Error(`Service account file nahi mili: ${abs}. BACKEND-SETUP-LIST.md Part 5 dekho.`);
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({ credential: cert(getServiceAccount()) });

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export default app;

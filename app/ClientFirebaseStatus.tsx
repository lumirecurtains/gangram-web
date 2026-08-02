"use client";

// Client-side Firebase SDK status checker (Step 1 verification)

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ClientFirebaseStatus() {
  const [status, setStatus] = useState<string>("checking...");

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "main"));
        if (snap.exists()) {
          setStatus("Firebase client SDK ✅ connected (settings doc mila)");
        } else {
          setStatus("Firebase client SDK ✅ connected (settings doc abhi nahi hai — expected, Step 2 mein banega)");
        }
      } catch (e: any) {
        setStatus("Firebase client SDK loaded — Firestore read error: " + (e?.message || e));
      }
    })();
  }, []);

  return <div className={`status-item`}><span>🔥 Client SDK (browser)</span><span className={status.startsWith("Firebase client SDK ✅") ? "ok" : "err"}>{status}</span></div>;
}

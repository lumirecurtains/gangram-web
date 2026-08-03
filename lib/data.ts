// 📡 Real-time data — Firestore se (onSnapshot = owner changes turant dikhenge)

import { collection, doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "./firebase";
import { Category, MenuItem, Settings } from "./types";

const DEFAULT_SETTINGS: Settings = {
  name: "Gangaram Dairy",
  tagline: "Ghar Ka Swaad, Seedha Aapke Darwaze Tak",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918709734024",
  address: "Station Road, Gangaram Chowk, Begusarai, Bihar",
  phone: "+91 87097 34024",
  hours: "8 AM – 10 PM",
  open: true,
  openHour: 8,
  closeHour: 22,
  holidays: [],
  banner: "",
  ownerEmails: [],
  deliveryBands: [
    { km: 1, charge: 20 },
    { km: 3, charge: 40 },
    { km: 5, charge: 70 },
    { km: 99, charge: 100 },
  ],
};

export function onSettings(cb: (s: Settings) => void, onErr?: () => void): Unsubscribe {
  return onSnapshot(
    doc(db, "settings", "main"),
    (snap) => cb(snap.exists() ? (snap.data() as Settings) : DEFAULT_SETTINGS),
    (err) => {
      console.error("settings load error:", err?.message);
      onErr?.();
      // fallback: default settings se bhi chalao (offline resilience)
      cb(DEFAULT_SETTINGS);
    }
  );
}

export function onCategories(cb: (c: Category[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, "categories"),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
      list.sort((a, b) => a.order - b.order);
      cb(list);
    },
    () => cb([])
  );
}

export function onMenuItems(cb: (m: MenuItem[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, "menuItems"),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MenuItem);
      list.sort((a, b) => a.order - b.order);
      cb(list);
    },
    () => cb([])
  );
}

// Open/Closed logic — manual owner override & closure modes (Task 3)
export function isRestaurantOpen(s: Settings): boolean {
  if (s.closureMode === "temp_close" || s.closureMode === "holiday") return false;
  if (s.open === false) return false;
  if (s.open === true || s.closureMode === "open") return true;
  return true;
}

// Customer-facing closure message helper (Task 3)
export function getClosureNote(s: Settings): string {
  if (s.closureMessage && s.closureMessage.trim()) {
    return s.closureMessage.trim();
  }
  if (s.closureMode === "holiday") {
    const when = s.reopenDate || s.reopenTime ? `Opens ${s.reopenDate || "soon"} ${s.reopenTime ? "at " + s.reopenTime : ""}`.trim() : "";
    return `🌴 Restaurant is closed for Holiday Mode. ${when}`.trim();
  }
  if (s.closureMode === "temp_close") {
    const when = s.reopenDate || s.reopenTime ? `Opens ${s.reopenDate || "soon"} ${s.reopenTime ? "at " + s.reopenTime : ""}`.trim() : "";
    return `⏸️ Restaurant is temporarily closed. ${when}`.trim();
  }
  const when = s.reopenDate || s.reopenTime ? `Opens ${s.reopenDate || "tomorrow"} ${s.reopenTime ? "at " + s.reopenTime : ""}`.trim() : `Hours: ${s.hours || "8 AM – 10 PM"}`;
  return `😴 Restaurant is currently closed. ${when}`.trim();
}

// Delivery charge — bands se
export function bandCharge(s: Settings, km: number): number {
  const bands = s.deliveryBands || DEFAULT_SETTINGS.deliveryBands;
  for (const b of bands) {
    if (km <= b.km) return b.charge;
  }
  return bands[bands.length - 1]?.charge ?? 40;
}

// Spherical Haversine distance calculation in KM (Sprint 2 - Task 3)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.round(dist * 10) / 10; // Round to 1 decimal place
}

// Automatic delivery fee calculation (Sprint 2 - Task 5)
export function calculateDeliveryFee(s: Settings, distanceKm: number): number {
  const base = s.baseDeliveryCharge ?? 20;
  const perKm = s.perKmCharge ?? 10;
  return Math.round(base + distanceKm * perKm);
}

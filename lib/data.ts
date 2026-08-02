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

// Open/Closed logic — manual owner override has highest priority
export function isRestaurantOpen(s: Settings): boolean {
  if (s.open === false) return false;
  if (s.open === true) return true;
  return true;
}

// Delivery charge — bands se
export function bandCharge(s: Settings, km: number): number {
  const bands = s.deliveryBands || DEFAULT_SETTINGS.deliveryBands;
  for (const b of bands) {
    if (km <= b.km) return b.charge;
  }
  return bands[bands.length - 1]?.charge ?? 40;
}

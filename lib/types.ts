// 📦 Types — Gangaram Pilot ke saare data shapes

export interface DeliveryBand {
  km: number;      // upper limit (0-1, 1-3, 3-5, 5+)
  charge: number;  // ₹
}

export interface Settings {
  name: string;
  tagline: string;
  whatsapp: string;       // with country code, e.g. 918709734024
  address: string;
  phone: string;
  hours: string;
  open: boolean;          // manual override (owner toggle)
  openHour: number;       // 8
  closeHour: number;      // 22
  holidays: string[];     // ["2026-08-15", ...]
  banner: string;         // Cloudinary URL (optional)
  ownerEmails: string[];  // admin auth — rules ke liye
  deliveryBands: DeliveryBand[];
  // Extended closure fields (Task 3)
  closureMode?: "open" | "temp_close" | "holiday";
  reopenDate?: string;
  reopenTime?: string;
  closureMessage?: string;
  // Extended location & delivery fields (Sprint 2)
  restaurantLat?: number;
  restaurantLng?: number;
  maxDeliveryKm?: number;
  baseDeliveryCharge?: number;
  perKmCharge?: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  desc: string;
  categoryId: string;
  photo: string;      // Cloudinary URL — khaali ho toh emoji fallback
  emoji: string;      // fallback display (demo jaisa)
  veg: boolean;
  tag: string;        // "Bestseller", "Chef Special"...
  available: boolean;
  order: number;
  // Sprint A1 Product Intelligence & Badges
  views?: number;
  ordersCount?: number;
  reviewCount?: number;
  avgRating?: number;
  ownersChoice?: boolean;
}

export interface CartLine {
  item: MenuItem;
  qty: number;
}

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "customer_confirmed"
  | "review_completed"
  | "cancelled";

export type StatusActor = "system" | "owner" | "customer";

export interface StatusHistoryEntry {
  stage: OrderStatus;
  timestamp: number;
  actor: StatusActor;
  note?: string | null;
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  orderNo: string;          // GD-1001
  customerName: string;
  customerPhone: string;
  address: string;
  items: OrderItem[];
  itemTotal: number;
  deliveryCharge: number;
  grandTotal: number;
  distanceKm?: number | null;
  status: OrderStatus;
  statusHistory?: StatusHistoryEntry[];
  estimatedWindowStart?: number | null;
  estimatedWindowEnd?: number | null;
  acceptedAt?: number | null;
  deliveredAt?: number | null;
  confirmedAt?: number | null;
  confirmedBy?: "customer" | "auto" | null;
  cancellationReason?: string | null;
  deliveryProofNote?: string | null;
  deliveryProofPhotoRef?: string | null;
  createdAt: number;
}

export interface Review {
  id: string;
  productId?: string;
  name: string;
  phone: string;
  rating: number; // 1-5
  text: string;
  hidden: boolean;
  createdAt: number;
  updatedAt?: number;
}

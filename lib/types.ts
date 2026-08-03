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
}

export interface CartLine {
  item: MenuItem;
  qty: number;
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
  status: "placed";
  createdAt: number;
}

export interface Review {
  id: string;
  name: string;
  phone: string;
  rating: number; // 1-5
  text: string;
  hidden: boolean;
  createdAt: number;
}

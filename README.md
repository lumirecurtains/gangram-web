# 🥛 Gangaram Dairy — Pilot Edition (Frontend Demo)

> **Demo build:** Single restaurant, vegetarian, direct WhatsApp ordering.
> Mobile-first + premium animations. Owner ko dikhane ke liye.

## 📁 Files

| File | Kya hai |
|---|---|
| `index.html` | **Poora animated frontend demo** — ek hi file mein (open karo, turant chalega) |
| `README.md` | Yeh file |

## ✨ Kya-kya bana hai (customer side)

- **Hero** — letter-by-letter reveal, floating food emojis, gradient shine button
- **Open/Closed pill** — pulsing dot, time ke hisaab se auto (8 AM – 10 PM)
- **Ticker marquee** — offers strip scroll
- **Category chips** — horizontal scroll, active slide, filter
- **Food grid** — 20 vegetarian dishes, 6 categories, gradient art cards (demo ke liye emoji-based)
- **Add to cart** — flying emoji animation + badge bounce + toast
- **Cart drawer** — slide-in, quantity controls, subtotal
- **Checkout modal** — naam/phone/address + distance bands (₹20–₹100) + bill breakdown
- **WhatsApp handoff** — formatted order message → `wa.me` link, customer tap pe send
- **Success screen** — SVG checkmark draw animation + order number
- **Reviews** — horizontal scroll, stars, verified badge
- **Bottom nav** — glassy mobile nav with active indicator
- **Scroll reveals** — IntersectionObserver se fade-up
- **100% mobile-first** — phone pe pehle design, desktop bhi theek

## 🎨 Animations used

Pure CSS keyframes + JS (IntersectionObserver) — no external lib needed, instant load.
(Same effects Next.js + Framer Motion mein convert honge.)

## 📝 Demo details

- Restaurant: **Gangaram Dairy** (pure veg)
- WhatsApp demo number: `919999999999` — **badalna hai real number se** (owner dashboard setting banegi)
- 20 dishes: Starters, Main Course, Breads, Rice & Biryani, Sweets, Drinks

## 🔜 Next Steps (Next.js build)

1. Is design ko **Next.js 15 + Tailwind** mein convert karna
2. **Firebase** (Firestore + Auth + Storage) connect
3. **Owner Dashboard** — menu manage, open/close, business hours, holiday, delivery bands, revenue
4. Real **dish photos** (AI generate / owner upload)
5. Vercel deploy

## ⚠️ Note

Yeh **sirf frontend demo hai** — koi backend/database nahi. Cart + WhatsApp message + animations sab working hain. Owner ko dikhane ke liye perfect.

---

## 🚀 STEP 1 — DONE (Firebase + Cloudinary Connected) — 2026-08-02

**Kya bana:**
- `lib/firebase.ts` — client SDK (browser)
- `lib/firebaseAdmin.ts` — admin SDK (server, service account se)
- `lib/cloudinary.ts` — Cloudinary config + upload signature helper
- `app/page.tsx` + `ClientFirebaseStatus.tsx` — status checker page
- `app/api/health/route.ts` — connection health API

**Real test (server chala ke):**
```
firebaseAdmin: ✅ connected (Firestore read OK)
cloudinary:   ✅ connected (ping: pong)
envVars:      11/11 present
```

**Local test karne ke liye:**
```bash
npm install
npm run dev
# browser: http://localhost:3000  → status dekho
# aur:      http://localhost:3000/api/health → JSON check
```

**Next:** Step 2 — Customer-facing (Homepage → Categories → Menu → Cart → Checkout). User ke "NEXT" bolne ka wait.

---

## 🚀 STEP 2 — Customer-Facing App (DONE) — 2026-08-02

**Kya bana:**
- `lib/types.ts` — saare types (Settings, Category, MenuItem, Order, Review)
- `lib/data.ts` — real-time Firestore data (onSnapshot — owner changes turant dikhte hain)
- `contexts/CartContext.tsx` — cart state (localStorage persist)
- `components/` — Header (open/closed pill), Hero (animations), CategoryChips, MenuGrid (reveal + fly-to-cart), CartDrawer, CheckoutModal (bands + bill), SuccessOverlay (checkmark), Toast
- `app/page.tsx` — sab compose (real-time data)
- `app/api/orders/route.ts` — order create (server-side, order number GD-XXXX)
- `firestore.rules` — REAL rules (public read menu, owner write, orders server-only)
- `scripts/seed.mjs` — demo data populate (npm run seed)

**Test results:** build pass, home 200, orders API validation working, health ok:true

## 🚀 CHALANE KE LIYE (2 steps)

### Step A: Seed data daalo (ek baar)
```bash
npm run seed
```
> ⚠️ Pehle `scripts/seed.mjs` kholo — settings mein `ownerEmails` array mein apna email daalo
> (owner dashboard login ke liye). Phir run karo.

### Step B: Rules deploy karo (ek baar)
```bash
firebase deploy --only firestore:rules
```

### Step C: App chalao
```bash
npm run dev
```
→ http://localhost:3000 — menu real Firebase se aayega, add to cart, checkout, WhatsApp order!

## 📌 Notes
- Menu mein photo nahi hai toh gradient + emoji fallback (demo jaisa) — owner Cloudinary se photo daalega
- Order number: GD-1001, GD-1002... (settings mein counter)
- Owner dashboard = Step 4 (abhi baaki)

# 🥛 Gangaram Dairy Pilot — BACKEND SETUP LIST (Complete)
## Jo tumhe (Lex-leo) setup karna hai — taaki main code mein daal sakun

> **Plan:** Tum ye list complete karo (tumhe Firebase/Vercel aata hai ✅) →
> main poora code likh dunga → deploy → owner ko live demo.
> **Demo (`index.html`) ko haath nahi lagaunga — wahi rahega.**

---

## 🔥 PART 1 — FIREBASE PROJECT (2 cheezein)

### 1.1 Naya Firebase Project banao (ENTERPRISE se ALAG!)
- [ ] [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
- [ ] Naam: `gangaram-pilot` (ya jo chahe — alag hona chahiye)
- [ ] Analytics **off** kar sakte ho (chhota project, zaroorat nahi)

### 1.2 Firestore Database (production mode)
- [ ] **Firestore Database** → Create → **production mode**
- [ ] Location: **asia-south1** (Mumbai — India ke liye best, speed)

---

## 🔐 PART 2 — AUTH (Owner + Super Admin login)

- [ ] **Authentication** → **Sign-in method** → **Email/Password** → **Enable**
- [ ] (Optional) Email verification ON

---

## 🖼️ PART 3 — STORAGE (dish photos + banner)

- [ ] **Storage** → Get started → rules abhi default chhodo (main code ke saath sahi rules dunga)
- [ ] Bucket location: **asia-south1**

---

## 🗄️ PART 4 — FIRESTORE COLLECTIONS (main code banaunga, tum kuch nahi)

Ye collections **code automatically bana dega** — tumhe kuch nahi karna, sirf jaan lo:

| Collection | Kya store karta hai | Access |
|---|---|---|
| `settings` | Restaurant naam, WhatsApp number, business hours, holidays, delivery bands, open/closed, banner URL | Public read / Owner write |
| `categories` | Menu categories (Starters, Main Course...) + order | Public read / Owner write |
| `menuItems` | Dish: name, price, desc, photo, veg, available, tag | Public read / Owner write |
| `orders` | Har order: items, totals, customer info, delivery charge, time | Customer create / Owner read |
| `customers` | Phone → naam, orders count, last order | Owner read (regulars pahchanne ke liye) |
| `reviews` | Rating, text, hidden flag | Customer create / Owner moderate |
| `adminUsers` | `{uid, role: "owner" | "super"}` | Owner/Super only |

---

## 📄 PART 5 — SERVICE ACCOUNT (server-side ke liye — revenue, super admin)

- [ ] Firebase Console → **Project settings → Service accounts**
- [ ] **Generate new private key** → JSON download karega
- [ ] Wo JSON **repo mein mat daalna!** — alag jagah rakhna (`.env` se path denge)
- [ ] **Vercel Note**: On Vercel, set `FIREBASE_SERVICE_ACCOUNT_KEY` as an Environment Variable in the Vercel project settings, containing the full service account JSON as one string.

---

## 🔑 PART 6 — .env.local (jo main code mein use karunga)

Tumhe ye sab Firebase console se nikaal ke bharne hain (Project settings → General):

```
# --- Client-side (NEXT_PUBLIC = browser mein dikhta hai, safe hai) ---
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# --- Server-side (sirf server pe — SECRET) ---
FIREBASE_SERVICE_ACCOUNT_PATH=C:\path\to\serviceAccountKey.json
```

---

## 📡 PART 7 — VERCEL (deploy)

- [ ] [vercel.com](https://vercel.com) → **Add New Project** → GitHub repo connect (ya CLI: `vercel`)
- [ ] **Environment Variables** mein upar wali .env.local ki saari values daalo
- [ ] Deploy — ho gaya! Live URL milega ✅
- [ ] (Optional) Custom domain

---

## 💬 PART 8 — WHATSAPP (koi setup nahi — bas ek number)

- [ ] Restaurant owner ka **real WhatsApp number** (with country code, jaise `919876543210`)
- [ ] Ye `settings` doc mein daala jayega (owner dashboard se change ho sakta hai — PRD 6a.1)

---

## 🧠 PART 9 — JO MAIN CODE MEIN BANAUNGA (tumhe kuch nahi karna)

| Cheez | Detail |
|---|---|
| Firestore security rules | Public read menu, customer create order/review, owner write sab |
| Storage rules | Customer nahi, sirf owner upload; public read images |
| Order number gen | `GD-1001` jaise auto |
| Delivery charge calc | Bands: 0-1km ₹20, 1-3km ₹40, 3-5km ₹70, 5+ ₹100 (owner change kar sake) |
| WhatsApp message | PRD §8 ke format mein — wa.me link |
| Open/Closed logic | Business hours + manual toggle + holiday scheduling |
| Owner Dashboard | Login → menu/category/banner/orders/revenue/customers/reviews/settings |
| Super Admin | Minimal (PRD §7): owner ki madad, reset, system health |
| Revenue Dashboard | Aaj/this week/this month, most-ordered, avg order value |

---

## ✅ FINAL CHECKLIST (tumhare liye — jitna karoge utna main code karunga)

- [ ] 1. Firebase project `gangaram-pilot` bana ✅
- [ ] 2. Firestore production mode, asia-south1
- [ ] 3. Email/Password auth enable
- [ ] 4. Storage bucket asia-south1
- [ ] 5. Service account JSON download (safe jagah)
- [ ] 6. .env.local ki values bhari (Part 6)
- [ ] 7. Owner ka real WhatsApp number
- [ ] 8. Vercel pe deploy ready (baad mein)

**Ye 8 cheezein complete karo → mujhe bolo "done" → main poora Next.js + Firebase code likh dunga (customer app + owner dashboard + super admin), tum sirf deploy karoge.**

---

## 📌 IMPORTANT REMINDER

- **Demo `index.html`** — untouched, wahi rahega (owner ko dikhane ke liye)
- **Enterprise Gangaram project** — untouched (pilot bilkul alag)
- Koi payment, koi kitchen/rider dashboard nahi (PRD §4 — by design)
- Ye list hi "backend setup" ki poori requirement hai — kuch aur nahi chahiye

*List v1.0 — 2026-08-02. Bolo done, main shuru karunga! 🚀*

---

## 🔄 UPDATE (2026-08-02) — Values Received + Cloudinary

### Storage: Cloudinary (Firebase Storage nahi)
- Firebase Storage ab Blaze (paid) maangta hai → **Cloudinary free tier** use ho raha hai.
- `menuItems.photo` + `settings.banner` → **Cloudinary URL string** (same field, alag source).

### Env vars (Part 6 update — user ne values de di hain, .env.local mein saved):

```
# Cloudinary (images)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=w3pnzga4
CLOUDINARY_API_KEY=798292475879637
CLOUDINARY_API_SECRET=Gkt0tBQGF2VZYZ2XJQWBQCIa0jE

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=918709734024
```

### Status: Values received 2026-08-02
- ✅ Firebase 6 keys — saved `.env.local`
- ✅ Service account JSON — saved `serviceAccountKey.json` (openssl: key valid ✅)
- ✅ Cloudinary 3 values — saved
- ✅ WhatsApp number — saved (8709734024 → 918709734024, +91 assume)
- ⏳ Vercel project status — abhi nahi aayi (deploy ke time chahiye, code ke liye nahi)
- ⏳ Coding — user ke go-ahead ka wait (rule: explicit go-ahead ke baad hi shuru)

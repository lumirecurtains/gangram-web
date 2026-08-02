# 📌 GANGARAM PILOT — LOCKED DECISIONS (User ke Decisions — 2026-08-02)

> Ye decisions user (Lex-leo) ne personally liye hain — **inhe kabhi override mat karna.**
> Ye Pilot build ka permanent record hai.

---

## Decision 1: Product Photos — Consistent Premium Look 🖼️
- **Kya:** Admin koi bhi photo upload kare (Google screenshot, real photo, kuch bhi) — **card waisa hi premium dikhega** jaisa abhi animation demo mein dikhta hai.
- **Kaise:** Design system har image ko handle karega:
  - Fixed aspect ratio (uniform crop) — har card ek jaisa
  - Rounded corners + subtle border — consistent style
  - **Fallback:** Agar photo nahi hai → gradient background + emoji (demo jaisa)
  - Veg badge + tags (Bestseller/Chef Special) hamesha overlay
  - Naya product admin add kare → **waise hi reveal animation** mein aaye (fade-up card animation)
- **Rule:** Image quality consistent, crop uniform, animation same — chahe photo kisi bhi source se ho.

## Decision 2: Super Admin = FULL POWER 👑
- **Kya:** Super Admin ke paas **admin ke saare powers + zyada** honge.
- **Detail:** Jo bhi Owner/Admin kar sakta hai (menu, categories, orders, reviews, settings, revenue, banner...) — **Super Admin bhi kar sakta hai**. Plus:
  - Kisi bhi data ko edit/delete kar sakta hai
  - Owner ki madad/impersonation (login as owner)
  - Owner access reset
  - System health visibility
  - Sab kuch — jo file mein hai + poore powers
- **Note:** PRD mein super admin "minimal" likha tha — **user ne ise personally change kiya**: Super Admin = All Powers. Ye naya decision PRD ko override karta hai (user's personal choice).

---

## Current Status (Jab Tak Setup Complete Nahi)
- Demo `index.html` — untouched (owner ko dikhane ke liye)
- Enterprise Gangaram — untouched
- Backend setup list — user complete kar raha hai
- Coding — jab setup values aayengi, direct shuru

---

*Locked by Lex-leo — 2026-08-02. Decisions personal hain, override nahi honge.*

---

## Decision 3: Cloudinary for Images (Firebase Storage NAHI) ☁️
- **Date:** 2026-08-02 (Claude ne guide kiya, user ne setup complete kiya)
- **Kya:** Firebase Storage ko chhod diya (Blaze/paid plan chahiye) — **Cloudinary free tier** use ho raha hai image hosting ke liye (dish photos + banner).
- **Asar:** Sirf image upload/hosting ka source badla. Firestore mein `menuItems.photo` aur `settings.banner` field mein **Cloudinary URL (string)** store hoga — same fields, alag source.
- **Baaki sab plan jaisa:** Firebase Firestore, Auth, Vercel — bilkul as planned.
- **User status:** Saare setup values ready — ek-ek karke share karega (Firebase config, service account, Cloudinary cloud name/API key/API secret, WhatsApp number, Vercel status).
- **Rule:** Coding tabhi shuru hogi jab user explicit go-ahead dega (saari values confirm hone ke baad).


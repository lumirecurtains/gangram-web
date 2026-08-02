# 🔍 Gangaram Pilot — Problem Finder (Diagnostic)
# Ye check karta hai ki sab kuch sahi hai ya nahi.
# Bash mein chalao:  bash diag.sh

echo "=== 1. GIT STATUS ==="
git status | head -5
echo ""
echo "=== 2. FILES CHECK ==="
for f in .env.local serviceAccountKey.json firestore.rules package.json; do
  if [ -f "$f" ]; then echo "  ✅ $f — MILA"; else echo "  ❌ $f — NAHI HAI!"; fi
done
echo ""
echo "=== 3. .env.local CONTENT (secrets masked) ==="
if [ -f .env.local ]; then
  sed 's/=\(.\{6\}\).*/=\1.../' .env.local
else
  echo "  ❌ .env.local missing — ye banao!"
fi
echo ""
echo "=== 4. NODE MODULES ==="
if [ -d node_modules ]; then echo "  ✅ node_modules hai"; else echo "  ❌ node_modules nahi — npm install karo"; fi
echo ""
echo "=== 5. LATEST COMMIT ==="
git log --oneline -3
echo ""
echo "=== 6. FIREBASE CONNECT TEST ==="
node -e "
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
try {
  const sa = JSON.parse(fs.readFileSync('./serviceAccountKey.json','utf8'));
  const app = initializeApp({ credential: cert(sa) }, 'diag');
  const db = getFirestore(app);
  db.collection('settings').doc('main').get().then(snap => {
    console.log(snap.exists ? '  ✅ Firebase connected — settings mila' : '  ⚠️ Firebase connected — settings nahi');
    process.exit(0);
  }).catch(e => { console.log('  ❌ Firebase fail:', e.message); process.exit(1); });
} catch(e) { console.log('  ❌ serviceAccountKey.json problem:', e.message); }
"
echo ""
echo "=== DONE — agar koi ❌ dikha toh wahi problem hai ==="

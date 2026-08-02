// 🖼️ Image compressor — phone ki badi photo ko chhota karo (slow net pe bhi fast upload)
// 5MB photo → ~150KB (800px max, JPEG quality 0.82)
// Ye client-side (browser) mein chalta hai — upload se pehle compress

export interface CompressResult {
  file: File;
  width: number;
  height: number;
  dataUrl?: string; // preview ke liye optional
}

export async function compressImage(file: File, maxDim = 800, quality = 0.82): Promise<CompressResult> {
  // Agar already chhoti hai (SVG ya < 300KB) toh seedha bhej do
  if (file.size < 300 * 1024 || file.type === "image/svg+xml") {
    return { file, width: 0, height: 0 };
  }

  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  const outDataUrl = canvas.toDataURL("image/jpeg", quality);
  const blob = await (await fetch(outDataUrl)).blob();
  const outFile = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
  });

  return { file: outFile, width, height, dataUrl: outDataUrl };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Cloudinary upload (signed) — compress + upload + timeout ke saath
export async function uploadToCloudinary(
  file: File,
  token: string | undefined,
  onState?: (s: "compressing" | "uploading") => void
): Promise<string> {
  onState?.("compressing");
  const { file: small } = await compressImage(file);

  onState?.("uploading");
  const sigRes = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const sig = await sigRes.json();
  if (!sig.ok) throw new Error(sig.error || "Signature fail");

  const form = new FormData();
  form.append("file", small);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);

  // 60s timeout — hang nahi hoga, error dikhega
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);

  try {
    const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
      method: "POST",
      body: form,
      signal: ctrl.signal,
    });
    const data = await up.json();
    if (!data.secure_url) throw new Error(data.error?.message || "Upload fail");
    return data.secure_url as string;
  } finally {
    clearTimeout(timer);
  }
}

// 🖼️ Image compressor — phone ki badi photo ko chhota karo (slow net pe bhi fast upload)
// 5MB photo → ~150KB (800px max, JPEG quality 0.82)
// Ye client-side (browser) mein chalta hai — upload se pehle compress

export interface CompressResult {
  file: File;
  width: number;
  height: number;
  dataUrl?: string; // preview ke liye optional
}

export async function compressImage(file: File, maxDim = 800, quality = 0.85): Promise<CompressResult> {
  // SVG files are vector, return as is
  if (file.type === "image/svg+xml") {
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

  // 🌟 Fill solid crisp white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.drawImage(img, 0, 0, width, height);

  // 🤖 Autonomous background cleaner — detects fake checkerboard grid squares and cleans them to pure white
  removeCheckerboardBackground(ctx, width, height);

  const outDataUrl = canvas.toDataURL("image/jpeg", quality);
  const blob = await (await fetch(outDataUrl)).blob();
  const outFile = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
  });

  return { file: outFile, width, height, dataUrl: outDataUrl };
}

export function removeCheckerboardBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Helper: is pixel neutral light gray or white (fake PNG grid square)?
    const isGridColor = (r: number, g: number, b: number) => {
      const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      return diff <= 12 && r >= 170;
    };

    // Check top corner for checkerboard grid pattern
    let gridCount = 0;
    const sampleSize = 25;
    for (let y = 0; y < Math.min(sampleSize, height); y++) {
      for (let x = 0; x < Math.min(sampleSize, width); x++) {
        const idx = (y * width + x) * 4;
        if (isGridColor(data[idx], data[idx + 1], data[idx + 2])) {
          gridCount++;
        }
      }
    }

    // If top corner contains fake checkerboard pattern, replace grid pixels with pure white
    if (gridCount > (sampleSize * sampleSize) * 0.55) {
      for (let i = 0; i < data.length; i += 4) {
        if (isGridColor(data[i], data[i + 1], data[i + 2])) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  } catch (err) {
    console.warn("Background cleaning skipped:", err);
  }
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

// ☁️ CLOUDINARY — server-side config (dish photos + banner)
// .env.local se values — API key/secret sirf server pe (NEXT_PUBLIC nahi)

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/** Cloudinary se signed upload URL signature (client ko upload karne ke liye) */
export function getUploadSignature(timestamp: number) {
  const params = { timestamp };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET || "");
  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
}

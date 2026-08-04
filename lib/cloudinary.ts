// ☁️ CLOUDINARY — server-side config (dish photos + banner)
// .env.local se values — API key/secret sirf server pe (NEXT_PUBLIC nahi)
// Security Sprint S3: Scoped upload signatures (L-1)

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/** Cloudinary signed upload URL signature scoped to folder */
export function getUploadSignature(timestamp: number, folder = "gangaram_uploads") {
  const params = { folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET || "");
  return {
    signature,
    timestamp,
    folder,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
}

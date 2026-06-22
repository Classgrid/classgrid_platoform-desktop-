import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// We initialize the S3 client for Cloudflare R2
// Credentials should be provided in your .env file
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Generates a presigned URL that the frontend can use to upload a file directly to Cloudflare R2
 * This completely bypasses the Express server so we don't have payload limit issues.
 */
export async function generateR2UploadUrl(fileName, fileType) {
  const bucketName = process.env.R2_BUCKET_NAME || "classgrid-bucket";
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    ContentType: fileType,
  });

  // URL expires in 5 minutes
  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

  // R2 public URL format: https://<your-custom-domain>/<fileName>
  // Or the default R2 dev URL. User should define R2_PUBLIC_URL in .env
  const publicBaseUrl = process.env.R2_PUBLIC_URL || `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;
  
  return {
    uploadUrl: signedUrl,
    publicUrl: `${publicBaseUrl}/${fileName}`
  };
}

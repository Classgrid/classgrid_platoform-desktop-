import { S3Client } from "@aws-sdk/client-s3";

export const BUCKET_NAME = (process.env.AWS_S3_BUCKET || "erp-classgrid").trim();
export const S3_REGION = (process.env.AWS_S3_REGION || "eu-north-1").trim();
export const CDN_BASE_URL = (process.env.CDN_BASE_URL || "https://cdn.classgrid.in")
    .trim()
    .replace(/\/+$/, "");

const configuredProtectedPrefixes = (process.env.AWS_S3_PROTECTED_PREFIXES || "")
    .split(",")
    .map((prefix) => prefix.trim().replace(/^\/+/, ""))
    .filter(Boolean);

export const PROTECTED_PREFIXES = Object.freeze([
    "Homepage.png",
    ...configuredProtectedPrefixes.filter((prefix) => prefix !== "Homepage.png"),
]);

const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
const sessionToken = process.env.AWS_SESSION_TOKEN?.trim();

const credentials = accessKeyId && secretAccessKey
    ? {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
    }
    : undefined;

export const s3Client = new S3Client({
    region: S3_REGION,
    ...(credentials ? { credentials } : {}),
});

export default s3Client;

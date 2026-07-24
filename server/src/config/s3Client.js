import { S3Client } from "@aws-sdk/client-s3";

export const BUCKET_NAME = (
    process.env.AWS_S3_BUCKET
    || process.env.AWS_S3_ERP_BUCKET_NAME
    || "erp-classgrid"
).trim();
export const S3_REGION = (
    process.env.AWS_S3_REGION
    || process.env.AWS_S3_ERP_REGION
    || "eu-north-1"
).trim();

const configuredCdnBaseUrl = (
    process.env.CDN_BASE_URL
    || process.env.AWS_CLOUDFRONT_ERP_DOMAIN
    || "https://cdn.classgrid.in"
).trim();

export const CDN_BASE_URL = (
    /^https?:\/\//i.test(configuredCdnBaseUrl)
        ? configuredCdnBaseUrl
        : `https://${configuredCdnBaseUrl}`
).replace(/\/+$/, "");

const configuredProtectedPrefixes = (process.env.AWS_S3_PROTECTED_PREFIXES || "")
    .split(",")
    .map((prefix) => prefix.trim().replace(/^\/+/, ""))
    .filter(Boolean);

export const PROTECTED_PREFIXES = Object.freeze([
    ...configuredProtectedPrefixes,
]);

const standardAccessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
const standardSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
const sessionToken = process.env.AWS_SESSION_TOKEN?.trim();
const erpAccessKeyId = process.env.AWS_S3_ERP_ACCESS_KEY?.trim();
const erpSecretAccessKey = process.env.AWS_S3_ERP_SECRET_KEY?.trim();

const credentials = standardAccessKeyId && standardSecretAccessKey
    ? {
        accessKeyId: standardAccessKeyId,
        secretAccessKey: standardSecretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
    }
    : (
        erpAccessKeyId && erpSecretAccessKey
            ? {
                accessKeyId: erpAccessKeyId,
                secretAccessKey: erpSecretAccessKey,
            }
            : undefined
    );

export const s3Client = new S3Client({
    region: S3_REGION,
    ...(credentials ? { credentials } : {}),
});

export default s3Client;

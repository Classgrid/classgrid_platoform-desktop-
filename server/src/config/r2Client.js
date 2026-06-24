import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Parse environment variables
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'classgrid';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-14d5af5a38c6456da3b086aeea5188e1.r2.dev';

if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error('⚠️ Missing Cloudflare R2 credentials. R2 uploads will fail.');
}

// Initialize the AWS S3 client specifically pointing to Cloudflare R2
export const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
    },
});

/**
 * Uploads a Multer buffer to Cloudflare R2
 * @param {Buffer} buffer - The file buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type (e.g., 'image/jpeg')
 * @param {string} customPath - Optional custom object Key (e.g., 'banners/123.png')
 * @returns {Promise<string>} The public URL of the uploaded file
 */
export async function uploadBufferToR2(buffer, originalName, mimeType, customPath = null) {
    let uniqueFilename = customPath;
    if (!uniqueFilename) {
        // Generate a unique filename: timestamp-uuid.ext
        const ext = path.extname(originalName || '') || '';
        uniqueFilename = `assets/${Date.now()}-${uuidv4()}${ext}`;
    }

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: uniqueFilename,
        Body: buffer,
        ContentType: mimeType,
    });

    await r2Client.send(command);

    // Return the public URL for DB storage
    return `${R2_PUBLIC_URL}/${uniqueFilename}`;
}

/**
 * Deletes a file from Cloudflare R2 using its URL or Key
 * @param {string} fileIdentifier - The public URL or the object Key
 */
export async function deleteFromR2(fileIdentifier) {
    let key = fileIdentifier;
    
    // If a full URL is passed, extract just the key (the path after the domain)
    if (fileIdentifier.startsWith('http')) {
        const urlObj = new URL(fileIdentifier);
        key = urlObj.pathname.replace(/^\/+/, ''); // Remove leading slash
    }

    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });

    await r2Client.send(command);
    return true;
}

/**
 * Gets a presigned URL allowing the client browser to PUT a file directly
 * @param {string} fileName - The intended filename
 * @param {string} mimeType - The file's MIME type
 * @param {number} expiresInSeconds - Link validity duration
 * @param {string} customPath - Optional custom object Key
 */
export async function getPresignedUploadUrl(fileName, mimeType, expiresInSeconds = 3600, customPath = null) {
    let uniqueFilename = customPath;
    if (!uniqueFilename) {
        const ext = path.extname(fileName || '') || '';
        uniqueFilename = `assets/${Date.now()}-${uuidv4()}${ext}`;
    }

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: uniqueFilename,
        ContentType: mimeType,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
    return {
        uploadUrl: url,
        publicUrl: `${R2_PUBLIC_URL}/${uniqueFilename}` // This is what the frontend will save after success
    };
}

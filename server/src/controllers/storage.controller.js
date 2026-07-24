import path from "path";
import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CopyObjectCommand,
    CreateMultipartUploadCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    BUCKET_NAME,
    CDN_BASE_URL,
    PROTECTED_PREFIXES,
    s3Client,
} from "../config/s3Client.js";

export const MAX_STORAGE_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

const MULTIPART_THRESHOLD_BYTES = 100 * 1024 * 1024;
const MULTIPART_PART_SIZE_BYTES = 16 * 1024 * 1024;
const MULTIPART_CONCURRENCY = 4;
const MAX_LIST_LIMIT = 1000;
const MAX_BULK_DELETE_KEYS = 1000;
const METADATA_CONCURRENCY = 10;

class StorageRequestError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.name = "StorageRequestError";
        this.statusCode = statusCode;
    }
}

const CONTENT_TYPES_BY_EXTENSION = {
    ".avif": "image/avif",
    ".bmp": "image/bmp",
    ".css": "text/css",
    ".csv": "text/csv",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".gif": "image/gif",
    ".gz": "application/gzip",
    ".html": "text/html",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript",
    ".json": "application/json",
    ".m4a": "audio/mp4",
    ".mov": "video/quicktime",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".svg": "image/svg+xml",
    ".tar": "application/x-tar",
    ".txt": "text/plain",
    ".wav": "audio/wav",
    ".webm": "video/webm",
    ".webp": "image/webp",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xml": "application/xml",
    ".zip": "application/zip",
};

function sendSuccess(res, message, data) {
    return res.json({
        success: true,
        message,
        data,
    });
}

function getUserId(req) {
    return String(req.user?._id || req.user?.id || "unknown");
}

function auditStorageAction(req, action, keys, status = "success") {
    const affectedKeys = Array.isArray(keys) ? keys : [keys];
    console.log(
        `[Storage] userId=${getUserId(req)} action=${action} status=${status} keys=${JSON.stringify(affectedKeys)}`,
    );
}

function handleControllerError(req, res, operation, error, affectedKeys = []) {
    if (["upload", "delete", "bulk-delete", "rename"].includes(operation)) {
        auditStorageAction(req, operation, affectedKeys, "failed");
    }

    if (error instanceof StorageRequestError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
    }

    if (error?.name === "NoSuchKey" || error?.name === "NotFound" || error?.$metadata?.httpStatusCode === 404) {
        return res.status(404).json({
            success: false,
            message: "The requested S3 object was not found.",
        });
    }

    console.error(`[Storage] ${operation} failed:`, error);
    return res.status(500).json({
        success: false,
        message: `Failed to ${operation.replaceAll("-", " ")} storage object.`,
    });
}

function normalizeSegments(value, fieldName, { allowEmpty = false } = {}) {
    if (value === undefined || value === null || value === "") {
        if (allowEmpty) return [];
        throw new StorageRequestError(400, `${fieldName} is required.`);
    }

    if (typeof value !== "string") {
        throw new StorageRequestError(400, `${fieldName} must be a string.`);
    }

    const normalized = value.trim().replaceAll("\\", "/").replace(/^\/+/, "");
    if (!normalized) {
        if (allowEmpty) return [];
        throw new StorageRequestError(400, `${fieldName} is required.`);
    }

    if (/[\u0000-\u001F\u007F]/.test(normalized)) {
        throw new StorageRequestError(400, `${fieldName} contains invalid characters.`);
    }

    const rawSegments = normalized.split("/");
    if (rawSegments.some((segment) => segment === "." || segment === "..")) {
        throw new StorageRequestError(400, `${fieldName} contains an invalid path segment.`);
    }

    return rawSegments.filter(Boolean);
}

function normalizePrefix(value) {
    const segments = normalizeSegments(value, "prefix", { allowEmpty: true });
    return segments.length > 0 ? `${segments.join("/")}/` : "";
}

function normalizeObjectKey(value, fieldName = "key") {
    return normalizeSegments(value, fieldName).join("/");
}

function normalizeFolderName(value) {
    if (typeof value !== "string" || !value.trim()) {
        throw new StorageRequestError(400, "folderName is required.");
    }

    const folderName = value.trim();
    if (
        folderName === "."
        || folderName === ".."
        || folderName.includes("/")
        || folderName.includes("\\")
        || /[\u0000-\u001F\u007F]/.test(folderName)
    ) {
        throw new StorageRequestError(400, "folderName must be a single valid folder name.");
    }

    return folderName;
}

function normalizeUploadFileName(value) {
    if (typeof value !== "string") {
        throw new StorageRequestError(400, "The uploaded file must have a valid filename.");
    }

    const fileName = path.posix
        .basename(value.replaceAll("\\", "/"))
        .trim()
        .replace(/[\u0000-\u001F\u007F]/g, "");

    if (!fileName || fileName === "." || fileName === "..") {
        throw new StorageRequestError(400, "The uploaded file must have a valid filename.");
    }

    return fileName;
}

function parseListLimit(value) {
    if (value === undefined || value === "") return 100;

    const limit = Number(value);
    if (!Number.isInteger(limit) || limit < 1) {
        throw new StorageRequestError(400, "limit must be a positive integer.");
    }

    return Math.min(limit, MAX_LIST_LIMIT);
}

function buildCdnUrl(key) {
    return `${CDN_BASE_URL}/${key}`;
}

function inferContentType(key) {
    return CONTENT_TYPES_BY_EXTENSION[path.posix.extname(key).toLowerCase()]
        || "application/octet-stream";
}

function isProtectedKey(key) {
    return PROTECTED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function assertDeletable(key) {
    if (isProtectedKey(key)) {
        throw new StorageRequestError(403, `Deletion is not allowed for protected key: ${key}`);
    }
}

function encodeCopySource(key) {
    const encodedKey = key
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
    return `${encodeURIComponent(BUCKET_NAME)}/${encodedKey}`;
}

async function mapWithConcurrency(items, concurrency, mapper) {
    if (items.length === 0) return [];

    const results = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await mapper(items[currentIndex], currentIndex);
        }
    }

    const workers = Array.from(
        { length: Math.min(concurrency, items.length) },
        () => worker(),
    );
    await Promise.all(workers);
    return results;
}

async function getListedObjectContentType(key) {
    try {
        const metadata = await s3Client.send(new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        }));
        return metadata.ContentType || inferContentType(key);
    } catch (error) {
        console.warn(
            `[Storage] metadata lookup failed for key=${JSON.stringify(key)}; using inferred content type (${error?.name || "UnknownError"}).`,
        );
        return inferContentType(key);
    }
}

async function multipartUpload({ key, buffer, contentType }) {
    const createdUpload = await s3Client.send(new CreateMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    }));

    const uploadId = createdUpload.UploadId;
    if (!uploadId) {
        throw new Error("S3 did not return a multipart upload ID.");
    }

    try {
        const partCount = Math.ceil(buffer.length / MULTIPART_PART_SIZE_BYTES);
        const uploadedParts = [];

        for (let batchStart = 0; batchStart < partCount; batchStart += MULTIPART_CONCURRENCY) {
            const batchEnd = Math.min(batchStart + MULTIPART_CONCURRENCY, partCount);
            const batch = [];

            for (let partIndex = batchStart; partIndex < batchEnd; partIndex += 1) {
                const start = partIndex * MULTIPART_PART_SIZE_BYTES;
                const end = Math.min(start + MULTIPART_PART_SIZE_BYTES, buffer.length);
                const partNumber = partIndex + 1;

                batch.push(
                    s3Client.send(new UploadPartCommand({
                        Bucket: BUCKET_NAME,
                        Key: key,
                        UploadId: uploadId,
                        PartNumber: partNumber,
                        Body: buffer.subarray(start, end),
                        ContentLength: end - start,
                    })).then((result) => {
                        if (!result.ETag) {
                            throw new Error(`S3 did not return an ETag for multipart part ${partNumber}.`);
                        }
                        return {
                            ETag: result.ETag,
                            PartNumber: partNumber,
                        };
                    }),
                );
            }

            uploadedParts.push(...await Promise.all(batch));
        }

        uploadedParts.sort((first, second) => first.PartNumber - second.PartNumber);

        await s3Client.send(new CompleteMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: uploadedParts,
            },
        }));
    } catch (error) {
        try {
            await s3Client.send(new AbortMultipartUploadCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
            }));
        } catch (abortError) {
            console.error(
                `[Storage] failed to abort multipart upload for key=${JSON.stringify(key)}:`,
                abortError,
            );
        }
        throw error;
    }
}

export async function listObjects(req, res) {
    try {
        const prefix = normalizePrefix(req.query.prefix);
        const limit = parseListLimit(req.query.limit);
        const cursor = req.query.cursor;
        const search = req.query.search;

        if (cursor !== undefined && typeof cursor !== "string") {
            throw new StorageRequestError(400, "cursor must be a string.");
        }
        if (search !== undefined && typeof search !== "string") {
            throw new StorageRequestError(400, "search must be a string.");
        }

        const result = await s3Client.send(new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
            Delimiter: "/",
            MaxKeys: limit,
            ...(cursor ? { ContinuationToken: cursor } : {}),
        }));

        const searchTerm = search?.trim().toLowerCase() || "";
        const folders = (result.CommonPrefixes || [])
            .map(({ Prefix: folderPrefix }) => {
                const normalizedFolderPrefix = folderPrefix || "";
                return {
                    prefix: normalizedFolderPrefix,
                    name: path.posix.basename(normalizedFolderPrefix.replace(/\/$/, "")),
                };
            })
            .filter((folder) => !searchTerm || folder.name.toLowerCase().includes(searchTerm));

        const listedFiles = (result.Contents || [])
            .filter((object) => object.Key && !object.Key.endsWith("/"))
            .map((object) => ({
                key: object.Key,
                name: path.posix.basename(object.Key),
                size: object.Size || 0,
                lastModified: object.LastModified || null,
            }))
            .filter((file) => !searchTerm || file.name.toLowerCase().includes(searchTerm));

        const files = await mapWithConcurrency(
            listedFiles,
            METADATA_CONCURRENCY,
            async (file) => ({
                ...file,
                contentType: await getListedObjectContentType(file.key),
                cdnUrl: buildCdnUrl(file.key),
            }),
        );

        return sendSuccess(res, "Storage objects retrieved successfully.", {
            folders,
            files,
            nextCursor: result.IsTruncated ? (result.NextContinuationToken || null) : null,
            totalSize: files.reduce((sum, file) => sum + file.size, 0),
        });
    } catch (error) {
        return handleControllerError(req, res, "list", error);
    }
}

export async function uploadFile(req, res) {
    let key = "";

    try {
        if (!req.file) {
            throw new StorageRequestError(400, "No file was provided.");
        }

        if (req.file.size > MAX_STORAGE_UPLOAD_SIZE_BYTES) {
            throw new StorageRequestError(413, "File size exceeds the 2 GB limit.");
        }

        const prefix = normalizePrefix(req.query.prefix);
        const fileName = normalizeUploadFileName(req.file.originalname);
        const contentType = req.file.mimetype || "application/octet-stream";
        key = `${prefix}${fileName}`;

        if (req.file.size > MULTIPART_THRESHOLD_BYTES) {
            await multipartUpload({
                key,
                buffer: req.file.buffer,
                contentType,
            });
        } else {
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: contentType,
                ContentLength: req.file.size,
            }));
        }

        auditStorageAction(req, "upload", key);
        return sendSuccess(res, "File uploaded successfully.", {
            key,
            cdnUrl: buildCdnUrl(key),
            size: req.file.size,
            contentType,
        });
    } catch (error) {
        return handleControllerError(req, res, "upload", error, key ? [key] : []);
    }
}

export async function deleteObject(req, res) {
    let key = "";

    try {
        key = normalizeObjectKey(req.body?.key);
        assertDeletable(key);

        await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        }));

        auditStorageAction(req, "delete", key);
        return sendSuccess(res, "Storage object deleted successfully.", {
            deletedKey: key,
        });
    } catch (error) {
        return handleControllerError(req, res, "delete", error, key ? [key] : []);
    }
}

export async function deleteObjects(req, res) {
    let keys = [];

    try {
        if (!Array.isArray(req.body?.keys) || req.body.keys.length === 0) {
            throw new StorageRequestError(400, "keys must be a non-empty array.");
        }
        if (req.body.keys.length > MAX_BULK_DELETE_KEYS) {
            throw new StorageRequestError(
                400,
                `A maximum of ${MAX_BULK_DELETE_KEYS} keys can be deleted in one request.`,
            );
        }

        keys = [...new Set(
            req.body.keys.map((key, index) => normalizeObjectKey(key, `keys[${index}]`)),
        )];
        keys.forEach(assertDeletable);

        const result = await s3Client.send(new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: {
                Objects: keys.map((key) => ({ Key: key })),
                Quiet: false,
            },
        }));

        if (result.Errors?.length) {
            auditStorageAction(req, "bulk-delete", keys, "partial");
            console.error("[Storage] bulk-delete returned S3 errors:", result.Errors);
            return res.status(502).json({
                success: false,
                message: "S3 could not delete every requested object.",
            });
        }

        const deletedCount = result.Deleted?.length ?? keys.length;
        auditStorageAction(req, "bulk-delete", keys);
        return sendSuccess(res, "Storage objects deleted successfully.", {
            deletedCount,
        });
    } catch (error) {
        return handleControllerError(req, res, "bulk-delete", error, keys);
    }
}

export async function createFolder(req, res) {
    let folderKey = "";

    try {
        const prefix = normalizePrefix(req.body?.prefix);
        const folderName = normalizeFolderName(req.body?.folderName);
        folderKey = `${prefix}${folderName}/`;

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: folderKey,
            Body: Buffer.alloc(0),
            ContentLength: 0,
            ContentType: "application/x-directory",
        }));

        return sendSuccess(res, "Folder created successfully.", {
            folderKey,
        });
    } catch (error) {
        return handleControllerError(req, res, "create folder", error, folderKey ? [folderKey] : []);
    }
}

export async function getPresignedUrl(req, res) {
    let key = "";

    try {
        key = normalizeObjectKey(req.body?.key);
        const downloadUrl = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            }),
            { expiresIn: 60 * 60 },
        );

        return sendSuccess(res, "Temporary download URL generated successfully.", {
            downloadUrl,
            expiresIn: "1 hour",
        });
    } catch (error) {
        return handleControllerError(req, res, "generate presigned URL for", error, key ? [key] : []);
    }
}

export async function getObjectMetadata(req, res) {
    let key = "";

    try {
        key = normalizeObjectKey(req.query.key);
        const metadata = await s3Client.send(new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        }));

        return sendSuccess(res, "Storage object metadata retrieved successfully.", {
            key,
            size: metadata.ContentLength || 0,
            contentType: metadata.ContentType || inferContentType(key),
            lastModified: metadata.LastModified || null,
            cdnUrl: buildCdnUrl(key),
            etag: metadata.ETag || null,
        });
    } catch (error) {
        return handleControllerError(req, res, "get metadata for", error, key ? [key] : []);
    }
}

export async function renameObject(req, res) {
    let sourceKey = "";
    let destinationKey = "";

    try {
        sourceKey = normalizeObjectKey(req.body?.sourceKey, "sourceKey");
        destinationKey = normalizeObjectKey(req.body?.destinationKey, "destinationKey");

        if (sourceKey === destinationKey) {
            throw new StorageRequestError(400, "sourceKey and destinationKey must be different.");
        }
        assertDeletable(sourceKey);

        await s3Client.send(new CopyObjectCommand({
            Bucket: BUCKET_NAME,
            CopySource: encodeCopySource(sourceKey),
            Key: destinationKey,
        }));

        await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: sourceKey,
        }));

        auditStorageAction(req, "rename", [sourceKey, destinationKey]);
        return sendSuccess(res, "Storage object renamed successfully.", {
            newKey: destinationKey,
            cdnUrl: buildCdnUrl(destinationKey),
        });
    } catch (error) {
        return handleControllerError(
            req,
            res,
            "rename",
            error,
            [sourceKey, destinationKey].filter(Boolean),
        );
    }
}

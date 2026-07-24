import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
    MAX_STORAGE_UPLOAD_SIZE_BYTES,
    STORAGE_UPLOAD_RATE_LIMIT_PER_MINUTE,
    createFolder,
    deleteObject,
    deleteObjects,
    getObjectMetadata,
    getPresignedUrl,
    getStorageAnalyticsBreakdown,
    getStorageAnalyticsFiles,
    getStorageAnalyticsSummary,
    getStorageConfiguration,
    getStorageHealth,
    listObjects,
    renameObject,
    testStorageConnection,
    uploadFile,
} from "../controllers/storage.controller.js";

const router = express.Router();

const storageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_STORAGE_UPLOAD_SIZE_BYTES,
    },
});

const uploadRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: STORAGE_UPLOAD_RATE_LIMIT_PER_MINUTE,
    keyGenerator: (req) => String(req.user._id),
    validate: {
        ip: false,
        xForwardedForHeader: false,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(
            `[Storage] userId=${String(req.user?._id || "unknown")} action=upload status=rate-limited`,
        );
        return res.status(429).json({
            success: false,
            message: "Upload rate limit exceeded. Maximum 30 uploads per minute.",
        });
    },
});

function isSuperAdmin(req, res, next) {
    if (req.user?.role !== "super_admin") {
        return res.status(403).json({
            success: false,
            message: "Super admin access is required.",
        });
    }

    return next();
}

function singleStorageUpload(req, res, next) {
    storageUpload.single("file")(req, res, (error) => {
        if (!error) {
            return next();
        }

        console.warn(
            `[Storage] userId=${String(req.user?._id || "unknown")} action=upload status=rejected reason=${error.code || error.name || "invalid-upload"}`,
        );

        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                message: "File size exceeds the 2 GB limit.",
            });
        }

        return res.status(400).json({
            success: false,
            message: "Invalid multipart file upload.",
        });
    });
}

router.use(isAuthenticated, isSuperAdmin);

router.get("/configuration", getStorageConfiguration);
router.get("/health", getStorageHealth);
router.post("/test-connection", testStorageConnection);
router.get("/analytics/summary", getStorageAnalyticsSummary);
router.get("/analytics/files", getStorageAnalyticsFiles);
router.get("/analytics/breakdown", getStorageAnalyticsBreakdown);

router.get("/objects", listObjects);
router.post("/upload", uploadRateLimiter, singleStorageUpload, uploadFile);
router.delete("/object", deleteObject);
router.delete("/objects", deleteObjects);
router.post("/folder", createFolder);
router.post("/presigned-url", getPresignedUrl);
router.get("/metadata", getObjectMetadata);
router.post("/rename", renameObject);

export default router;

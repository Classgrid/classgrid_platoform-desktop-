import winston from "winston";
import "winston-daily-rotate-file";
import "winston-mongodb";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Ensure env variables are loaded if used directly
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, printf, colorize, json, metadata } = winston.format;

// Custom log format for readable console
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
});

// Create rotating file transport for API access logs
const fileTransport = new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, "../../../logs", "api-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: combine(timestamp(), json())
});

const transports = [
    fileTransport,
    new winston.transports.Console({
        format: combine(colorize(), timestamp(), consoleFormat)
    })
];

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

// Add MongoDB transport if URI is available
if (mongoUri) {
    transports.push(
        new winston.transports.MongoDB({
            // Store ALL logs (info, warn, error) — no level filter
            db: mongoUri,
            collection: "systemlogs",
            format: combine(timestamp(), metadata()),
            expireAfterSeconds: 2592000,
            capped: true,
            cappedSize: 10485760, // 10MB
            cappedMax: 10000 // Max 10,000 logs
        })
    );
}

// Configure main logger
export const accessLogger = winston.createLogger({
    level: "info",
    transports: transports
});

// Express middleware for logging specific route traffic
export const winstonMiddleware = (req, res, next) => {
    // Skip logging high-frequency polling routes to prevent log spam
    if (
        req.originalUrl.includes("/api/super-admin/error-logs") ||
        req.originalUrl.includes("/api/super-admin/health") ||
        req.originalUrl.includes("/api/super-admin/feature-flags")
    ) {
        return next();
    }

    const start = Date.now();
    
    // Log once request finishes
    res.on("finish", () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            ip: req.ip,
            durationMs: duration,
            orgId: req.organization ? req.organization._id : "none",
            userId: req.user ? req.user.id : "unauthenticated"
        };

        if (res.statusCode >= 400) {
            accessLogger.error(`API Request Failed: ${req.method} ${req.originalUrl}`, { metadata: logData });
        } else {
            accessLogger.info("API Request Dispatched", logData);
        }
    });

    next();
};

export default accessLogger;

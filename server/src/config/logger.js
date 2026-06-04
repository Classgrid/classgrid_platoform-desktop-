import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, printf, colorize, json } = winston.format;

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

// Configure main logger
export const accessLogger = winston.createLogger({
    level: "info",
    transports: [
        fileTransport,
        new winston.transports.Console({
            format: combine(colorize(), timestamp(), consoleFormat)
        })
    ]
});

// Express middleware for logging specific route traffic
export const winstonMiddleware = (req, res, next) => {
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
            accessLogger.warn("API Request Failed", logData);
        } else {
            accessLogger.info("API Request Dispatched", logData);
        }
    });

    next();
};

export default accessLogger;

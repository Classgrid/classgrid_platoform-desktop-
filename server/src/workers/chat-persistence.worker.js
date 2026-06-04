import IORedis from "ioredis";
import { flushChatStream } from "../services/socket.service.js";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const isDev = process.env.NODE_ENV !== "production";

const redisClient = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: isDev,
    retryStrategy: (times) => {
        if (isDev) return null;
        return Math.min(times * 200, 3000);
    },
});

redisClient.on("error", () => {});

/**
 * The Adaptive Chat Worker
 * Runs periodically to flush Redis Streams into MongoDB for all active organizations.
 */
let isRunning = false;

const startChatWorker = () => {
    // Skip in dev if Redis is not available
    if (isDev) {
        console.log("👷 Adaptive Chat Worker skipped (no Redis in dev)");
        return;
    }

    // Run every 10 seconds
    setInterval(async () => {
        if (isRunning) return;
        isRunning = true;

        try {
            // Find all chat streams
            let cursor = "0";
            const streamKeys = [];

            do {
                const [nextCursor, keys] = await redisClient.scan(
                    cursor,
                    "MATCH",
                    "chat:stream:org_*",
                    "COUNT",
                    100
                );
                cursor = nextCursor;
                streamKeys.push(...keys);
            } while (cursor !== "0");

            // Process each stream
            for (const key of streamKeys) {
                const orgId = key.split("org_")[1];
                if (orgId) {
                    await flushChatStream(orgId);
                }
            }
        } catch (error) {
            console.error("[Adaptive Worker] Error during periodic flush:", error);
        } finally {
            isRunning = false;
        }
    }, 10000); // 10 seconds interval

    console.log("👷 Adaptive Chat Worker Started (10s polling interval)");
};

startChatWorker();

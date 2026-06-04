import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const isDev = process.env.NODE_ENV !== "production";

const redis = new IORedis(REDIS_URL, {
  connectTimeout: 5000,
  maxRetriesPerRequest: null, // REQUIRED BY BULLMQ
  enableOfflineQueue: false,
  lazyConnect: isDev, // Don't auto-connect in dev if Redis isn't running
  retryStrategy: (times) => {
    if (isDev) return null; // Stop retrying entirely in local dev
    return Math.min(times * 200, 3000);
  },
});

redis.on("connect", () => {
  console.log("🟢 Redis Connected");
});

redis.on("error", () => {
  // Silenced — Redis is optional for local dev
});

redis.on("end", () => {
  if (!isDev) console.warn("🔴 Redis connection closed");
});

export default redis;
import mongoose from "mongoose";

// Global cache for serverless environments (like Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Pool sizing strategy for PM2 cluster mode:
 * ─────────────────────────────────────────────
 * MongoDB Atlas M10 supports ~500 connections.
 * PM2 cluster with N workers = N separate connection pools.
 *
 * Formula: maxPoolSize = floor(maxConnections / numWorkers) - buffer
 *
 * Staging  (t3.micro,  2 workers): maxPoolSize = 10, minPoolSize = 2
 * Production (t3.medium, 4 workers): maxPoolSize = 20, minPoolSize = 4
 * Development (fork, 1 worker):    maxPoolSize = 20, minPoolSize = 4
 */
const isProduction = process.env.NODE_ENV === "production";
const isStaging = process.env.NODE_ENV === "staging";

const POOL_CONFIG = isStaging
  ? { maxPoolSize: 10, minPoolSize: 2 }
  : { maxPoolSize: 20, minPoolSize: 4 };

const connectDB = async () => {
  // ✅ KEY FIX: Always check if the connection is still alive.
  // readyState 1 = connected. Without this check, cached.conn stays set
  // after a timeout, every route skips reconnection, and all APIs return 500.
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection dropped, clear the cache and reconnect
  if (cached.conn && mongoose.connection.readyState !== 1) {
    console.warn("⚠️ MongoDB connection stale (readyState=" + mongoose.connection.readyState + "). Reconnecting...");
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: POOL_CONFIG.maxPoolSize,
      minPoolSize: POOL_CONFIG.minPoolSize,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Heartbeat keeps the connection alive through Atlas's idle timeout
      heartbeatFrequencyMS: 10000,
      // Compressor for reduced bandwidth in production
      ...(isProduction || isStaging ? { compressors: ["zlib"] } : {}),
    };

    console.log(`=> Initializing MongoDB connection (pool: ${opts.minPoolSize}-${opts.maxPoolSize}, env: ${process.env.NODE_ENV || "dev"})...`);
    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB connected");
      return mongoose;
    }).catch((error) => {
      console.error("❌ MongoDB connection failed:", error.message);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error("Error awaiting MongoDB connection:", error.message);
    throw error;
  }
};

export default connectDB;

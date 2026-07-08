// 🔥 LOAD ENV FIRST — DO NOT REMOVE
import "./env.js";

import app from "./api/index.js";
import http from "http";
import util from "util";
import accessLogger from "./src/config/logger.js";

// ─────────────────────────────────────────────────────────
// 🎤 Capture ALL console output and send it to the Database
// ─────────────────────────────────────────────────────────
const origLog = console.log;
const origError = console.error;
const origWarn = console.warn;
const origInfo = console.info;

console.log = (...args) => accessLogger.info(util.format(...args));
console.error = (...args) => accessLogger.error(util.format(...args));
console.warn = (...args) => accessLogger.warn(util.format(...args));
console.info = (...args) => accessLogger.info(util.format(...args));

// 👷 Start Background Workers
import "./src/workers/index.js";

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// ─────────────────────────────────────────────────────────
// 🛡️  Global crash guards — prevent one bad request from
//     killing the entire Node.js process.
//     Logs errors but keeps the server alive.
// ─────────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception — server kept alive:", err.message);
  console.error(err.stack);
  // Do NOT call process.exit() — let it keep running
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Promise Rejection — server kept alive:");
  console.error("Promise:", promise);
  console.error("Reason:", reason);
  // Persist to SystemLog so AlertsPage shows real data
  import("./src/controllers/super-admin.controller.js")
    .then(({ captureError }) => captureError(
      reason instanceof Error ? reason : new Error(String(reason)),
      "unhandledRejection"
    ))
    .catch(() => { /* best-effort */ });
  // Do NOT call process.exit() — let it keep running
});

// ─────────────────────────────────────────────────────────
// 🚀  Start Server (Native Socket.io via Redis Adapter)
// ─────────────────────────────────────────────────────────
import { initSocket } from "./src/services/socket.service.js";

// Initialize socket on our HTTP server
initSocket(server);

server.listen(PORT, () => {
  console.log(`🔥 Server running at http://localhost:${PORT} (Socket.io Native)`);
});

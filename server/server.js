// ─────────────────────────────────────────────────────────
// 🎤 STEP 0: Override console BEFORE any imports
//    so that EVERY SINGLE log is captured into the database
// ─────────────────────────────────────────────────────────
import util from "util";
import accessLogger from "./src/config/logger.js";

const origLog = console.log;
const origError = console.error;
const origWarn = console.warn;
const origInfo = console.info;

// Send to BOTH: Winston (→ MongoDB) AND original stdout
console.log = (...args) => { const msg = util.format(...args); origLog(msg); accessLogger.info(msg); };
console.error = (...args) => { const msg = util.format(...args); origError(msg); accessLogger.error(msg); };
console.warn = (...args) => { const msg = util.format(...args); origWarn(msg); accessLogger.warn(msg); };
console.info = (...args) => { const msg = util.format(...args); origInfo(msg); accessLogger.info(msg); };

// 🔥 NOW load env (all console.logs inside env.js will be captured)
import "./env.js";

import app from "./api/index.js";
import http from "http";

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

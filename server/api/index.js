import "../env.js"; // 🔥 Load config FIRST
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import connectDB from "../config/db.js";
import passportConfig from "../src/services/passport.service.js";

import authRoutes from "../src/routes/auth.routes.js";
import userRoutes from "../src/routes/user.routes.js";
import chatRoutes from "../src/routes/chat.routes.js";
import notesRoutes from "../src/routes/notes.routes.js";
import classroomRoutes from "../src/routes/classroom.routes.js";
import activityRoutes from "../src/routes/activity.routes.js";
import messagingRoutes from "../src/routes/messaging.routes.js";
import classroomChatRoutes from "../src/routes/classroom_chat.routes.js";
import notificationRoutes from "../src/routes/notification.routes.js";
import commentsRoutes from "../src/routes/comments.routes.js";
import orgChatRoutes from "../src/routes/org_chat.routes.js";
import organizationRoutes from "../src/routes/organization.routes.js";
import orgAdminRoutes from "../src/routes/org.routes.js";
import adminRoutes from "../src/routes/admin.routes.js";
import digestRoutes from "../src/routes/digest.routes.js";
import attendanceDashboardRoutes from "../src/routes/attendance_dashboard.routes.js";
import attendanceRoutes from "../src/routes/attendance.routes.js";
import cronRoutes from "../src/routes/cron.routes.js";
import demoRoutes from "../src/routes/demo.routes.js";
import quizRoutes from "../src/routes/quiz.routes.js";
import marksRoutes from "../src/routes/marks.routes.js";
import assignmentRoutes from "../src/routes/assignment.routes.js";
import leaveRoutes from "../src/routes/leave.routes.js";
import meetRoutes from "../src/routes/meet.routes.js";
import calendarRoutes from "../src/routes/calendar.routes.js";
import zoomRoutes from "../src/routes/zoom.routes.js";
import reviewRoutes from "../src/routes/review.routes.js";
import timetableRoutes from "../src/routes/timetable.routes.js";
import academicRoutes from "../src/routes/academic.routes.js";
import webhookRoutes from "../src/routes/webhook.routes.js";
import threadChatRoutes from "../src/routes/thread_chat.routes.js";
import groupChatRoutes from "../src/routes/group_chat.routes.js";
import advancedQuizRoutes from "../src/routes/advanced_quiz.routes.js";
import pendingActionsRoutes from "../src/routes/pendingActions.routes.js";
import googleRoutes from "../src/routes/google.routes.js";
import holidaysRoutes from "../src/routes/holidays.routes.js";
import studentRoutes from "../src/routes/student.routes.js";
import facultyRoutes from "../src/routes/faculty.routes.js";
import studentProfileRoutes from "../src/routes/student-profile.routes.js";
import libraryRoutes from "../src/routes/library.routes.js";
import resultRoutes from "../src/routes/result.routes.js";
import examRoutes from "../src/routes/exam.routes.js";
import feedbackRoutes from "../src/routes/feedback.routes.js";
import courseRoutes from "../src/routes/course.routes.js";
import alumniRoutes from "../src/routes/alumni.routes.js";
import examinationsRoutes from '../src/routes/examinations.routes.js';
import internalTestsRoutes from "../src/routes/internal-tests.routes.js";
import eventsRoutes from "../src/routes/events.routes.js";
import academicPlanRoutes from "../src/routes/academic-plan.routes.js";
import crmRoutes from "../src/routes/crm.routes.js";
import certificateRoutes from "../src/routes/certificate.routes.js";
import feesRoutes from "../src/routes/fees.routes.js";
import pushRoutes from "../src/routes/push.routes.js";
import webPushRoutes from "../src/routes/web-push.routes.js";
import hierarchyRoutes from "../src/routes/hierarchy.routes.js";
import admissionRoutes from "../src/routes/admission.routes.js";
import onlineExamRoutes from "../src/routes/online-exam.routes.js";
import vivaRoutes from "../src/routes/viva.routes.js";
import analyticsRoutes from "../src/routes/analytics.routes.js";
import feeRecordRoutes from "../src/routes/fee-records.routes.js";
import teacherPlannerRoutes from "../src/routes/teacher-planner.routes.js";
import videoRoutes from "../src/routes/video.routes.js";
import liveRoutes from "../src/routes/live.routes.js";
import callRoutes from "../src/routes/call.routes.js";
import aiRoutes from "../src/routes/ai.routes.js";
import voiceRoutes from "../src/routes/voice.routes.js";
import marketplaceRoutes from "../src/routes/marketplace.routes.js";
import auditRoutes from "../src/routes/audit.routes.js";
import externalRoutes from "../src/routes/external.routes.js";
import payrollRoutes from "../src/routes/payroll.routes.js";
import canteenRoutes from "../src/routes/canteen.routes.js";
import courseLibraryRoutes from "../src/routes/course-library.routes.js";
import pastPaperRoutes from "../src/routes/past-paper.routes.js";
import superAdminRoutes from "../src/routes/super-admin.routes.js";
import forumRoutes from "../src/routes/forum.routes.js";
import supportRoutes from "../src/routes/support.routes.js";
import changelogRoutes from "../src/routes/changelog.routes.js";
import publicRoutes from "../src/routes/public.routes.js";
import uploadRoutes from "../src/routes/upload.routes.js";
import systemRoutes from "../src/routes/system.routes.js";
import { publicTenantRouter, orgWebsiteRouter, superAdminWebsiteRouter } from "../src/routes/org-website.routes.js";
import extractSubdomain, { resolveTenant, getPublicTenantInfo } from "../src/middleware/subdomain-router.middleware.js";
import { sendEmail } from "../src/services/brevo.service.js";
import { metricsMiddleware, startMetricsFlush } from "../src/middleware/metrics.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

console.log("BUILD VERSION: 2026-AUDIT");
console.log("SMTP HOST:", process.env.BREVO_SMTP_HOST);
console.log("SMTP USER:", process.env.BREVO_SMTP_USER);
console.log("SMTP SENDER:", process.env.BREVO_SENDER_EMAIL);

/* ---------- DB ---------- */
connectDB().catch(err => console.error("Initial DB connect error:", err));
startMetricsFlush(); // Start buffered metrics flush loop (60s interval)

/* ---------- CONFIG ---------- */
passportConfig(); // Initialize passport strategies

// 🔐 TRUST PROXY (Required for production behind reverse proxy like Vercel/Nginx)
app.set('trust proxy', 1);

/* ---------- MIDDLEWARE ---------- */
// 🛡️ Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Allow inline scripts and styles for typical React setups
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
      frameSrc: ["'self'", "https://www.google.com/recaptcha/"],
    },
  },
  crossOriginEmbedderPolicy: false, // Prevents blocking external images/iframes generically
}));

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const allowedStatic = [
        "https://api.classgrid.in",
        "https://classgrid.in",
        "http://127.0.0.1:3000",
        "https://www.classgrid.in",
        "https://classgrid.in",
        "https://classgridplatform.vercel.app",
        "https://nikhil.quantumchem.site"
      ];

      // Allow any *.classgrid.in subdomain (tenant portals)
      const isClassgridSubdomain = /^https:\/\/[a-z0-9-]+\.classgrid\.in$/.test(origin);
      const isLocalSubdomain = /^http:\/\/[a-z0-9-]+\.localhost(:\d+)?$/.test(origin);
      const isLocalhostDev = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (allowedStatic.includes(origin) || isClassgridSubdomain || isLocalSubdomain || isLocalhostDev) {
        return callback(null, true);
      }

      // For white-labeled custom domains (e.g. erp.mycollege.edu), we must allow the origin dynamically.
      // Since we use Bearer tokens for auth, reflecting any https:// origin is safe.
      if (origin.startsWith("https://")) {
        return callback(null, true);
      }

      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true
  })
);

// Razorpay admission webhook needs the raw request body for signature verification.
app.use("/api/admission/payments/webhook", express.raw({ type: "application/json", limit: "2mb" }));

// Skip JSON body parsing for webhook routes that rely on raw bodies.
app.use((req, res, next) => {
  if (
    req.originalUrl.startsWith('/api/admission/payments/webhook') ||
    req.originalUrl.startsWith('/api/payments/webhook')
  ) {
    return next();
  }
  express.json({ limit: '2mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET)); // Use cookie parser
app.use(passport.initialize());
app.use(extractSubdomain);

import { generalLimiter } from "../src/middleware/rateLimiter.js";
import { winstonMiddleware } from "../src/config/logger.js";

// Global API Rate Limiting (1000 requests / min)
app.use(generalLimiter);

// Structured Logging via Winston
app.use(winstonMiddleware);

// Debug Middleware: Log all requests
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  next();
});

// API Metrics Middleware (zero-overhead in-memory buffering)
app.use(metricsMiddleware);

/* ---------- CACHE CONTROL — Prevent bfcache on HTML pages ---------- */
app.use((req, res, next) => {
  // Only set no-store for HTML page requests (not for JS/CSS/image assets)
  if (!req.path.startsWith("/api") && !req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|webp|mp4|webm)$/i)) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
  }
  next();
});

/* ---------- API ROOT STATUS INTERCEPTOR ---------- */
app.get("/", (req, res, next) => {
  const host = req.hostname || "";
  if (host === "api.classgrid.in" || host.startsWith("api.localhost") || host === "localhost") {
    return res.json({ 
      name: "Ultimate Classgrid API", 
      version: "3.0.0", 
      status: "online", 
      env: process.env.NODE_ENV
    });
  }
  next();
});

/* ---------- STATIC FILES ---------- */
const isProduction = process.env.NODE_ENV === "production";
const clientDistPath = path.join(__dirname, "../../client/dist");

if (isProduction) {
  app.use(express.static(clientDistPath));
}

/* ---------- API ROUTES ---------- */
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/classroom", classroomRoutes); // Fix: Alias for singular access
app.use("/api/activity", activityRoutes);
app.use("/api/messages", messagingRoutes);
app.use("/api/classroom-chat", classroomChatRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/org-chat", orgChatRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/org", organizationRoutes);
app.use("/api/org-admin", orgAdminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/demo", demoRoutes);
app.use("/api/digest", digestRoutes);
app.use("/api/attendance", attendanceDashboardRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/examinations", examinationsRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/platform-feedback", feedbackRoutes); // Added for frontend consistency
app.use("/api/courses", courseRoutes);
app.use("/api/meet", meetRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/zoom", zoomRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/threads", threadChatRoutes);
app.use("/api/group-chat", groupChatRoutes);
app.use("/api/advanced-quiz", advancedQuizRoutes);
app.use("/api/pending-actions", pendingActionsRoutes);
app.use("/api/google", googleRoutes);
app.use("/api/holidays", holidaysRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student-profile", studentProfileRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/internal-tests", internalTestsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/academic-plans", academicPlanRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/fees", feesRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/web-push", webPushRoutes);
app.use("/api/hierarchy", hierarchyRoutes);
app.use("/api/admission", admissionRoutes);
app.use("/api/online-exam", onlineExamRoutes);
app.use("/api/viva", vivaRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/fee-records", feeRecordRoutes);
app.use("/api/teacher-planner", teacherPlannerRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/live", liveRoutes);
app.use("/api/call", callRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/external", externalRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/canteen", canteenRoutes);
app.use("/api/course-library", courseLibraryRoutes);
app.use("/api/past-papers", pastPaperRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/changelog", changelogRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/public/tenant", publicTenantRouter);   // GET /api/public/tenant/resolve?slug=...
app.use("/api/org-website", orgWebsiteRouter);       // Org admin CMS endpoints
app.use("/api/super-admin", superAdminWebsiteRouter);// Super admin: list all websites

// 🌐 MODULE 22: Public Tenant Info (Subdomain Resolution)
app.get("/api/tenant/info", getPublicTenantInfo);

/* ---------- HEALTH ---------- */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    env: process.env.NODE_ENV || "development"
  });
});

if (!isProduction) {
  app.get("/api/email-test", async (req, res) => {
    console.log("TEST ROUTE HIT");

    try {
      const info = await sendEmail({
        to: process.env.SUPER_ADMIN_EMAIL || "support@classgrid.in",
        subject: "Direct SMTP Test",
        text: "Testing direct send",
        html: "<h1>Direct Test</h1>"
      });
      console.log("TEST DIRECT SEND INFO", info);
      res.send("Done: " + JSON.stringify(info));
    } catch (error) {
      console.error("TEST DIRECT SEND ERROR", error);
      res.status(500).send("Error: " + error.message);
    }
  });
}

/* ---------- LEGACY OAUTH CALLBACK REDIRECTS ---------- */
app.get("/api/auth/callback/google", (req, res) => {
  const qs = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
  res.redirect(307, `/api/auth/google/callback${qs}`);
});
app.get("/api/auth/callback/github", (req, res) => {
  const qs = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
  res.redirect(307, `/api/auth/github/callback${qs}`);
});
app.get("/api/auth/callback/facebook", (req, res) => {
  const qs = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
  res.redirect(307, `/api/auth/facebook/callback${qs}`);
});

app.get("/api/config", (req, res) => {
  res.json({ recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY });
});

/* ---------- REACT SPA ROUTING (CATCH-ALL) ---------- */
// Any route not starting with /api will be handled by React Router
app.get("*", (req, res) => {
  if (req.path === "/") {
    return res.json({ 
      name: "Ultimate Classgrid API", 
      version: "3.0.0", 
      status: "online", 
      env: process.env.NODE_ENV
      /* 
      health: {
        database: "✅ Connected",
        redis: "✅ Working",
        login_system: "✅ Works",
        api_routes: "✅ 78 Modules Active",
        production_app: "✅ Healthy"
      }
      */
    });
  }
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API not found" });
  }

  if (isProduction) {
    res.sendFile(path.join(clientDistPath, "index.html"), err => {
      if (err) res.status(500).send("React build missing.");
    });
  } else {
    // In development, Vite dev server handles all client routing
    // This catch-all only runs for the Express server (port 3000)
    res.status(200).json({ name: "Classgrid API", version: "1.0.0", status: "online" });
  }
});

/* ---------- GLOBAL ERROR HANDLER ---------- */
import { captureError } from "../src/controllers/super-admin.controller.js";
app.use((err, req, res, next) => {
  console.error("🔥 [Global Error]:", err);
  captureError(err, `${req.method} ${req.originalUrl}`);

  // Format consistently, no stack trace
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong",
    code: err.code || "SERVER_ERROR"
  });
});

export default app;

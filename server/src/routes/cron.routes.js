import express from "express";
import connectDB from "../../config/db.js";
import { processDemoExpiryReminders } from "../services/demo-expiry-reminder.service.js";

const router = express.Router();

/**
 * GET /api/cron/plan-expiry-check
 *
 * Checks real demo subscriptions from OrgSubscription and queues milestone emails for:
 * - 7 days left  -> review reminder
 * - 3 days left  -> demo ending soon
 * - 1 day left   -> final reminder
 * - expired      -> payment required / continue with paid access
 *
 * Secured by a CRON_SECRET header to prevent unauthorized access.
 */
router.get("/plan-expiry-check", async (req, res) => {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers["authorization"];

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        await connectDB();
        const results = await processDemoExpiryReminders(new Date());

        return res.json({
            message: `Demo reminder check complete. ${results.queued} reminder(s) queued.`,
            ...results,
            errors: results.errors.length ? results.errors : undefined,
        });
    } catch (err) {
        console.error("[Cron] Plan expiry check error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * GET /api/cron/process-email-queue
 *
 * Processes pending email jobs from the MongoDB queue.
 * Runs every minute via Vercel cron.
 *
 * Safeguards:
 *  - Max 10 emails per run (Vercel 10s limit)
 *  - 8-second execution time guard
 *  - Atomic job locking (prevents duplicate sends)
 *  - Exponential backoff retry on failure
 */
router.get("/process-email-queue", async (req, res) => {
    const cronStart = Date.now();
    try {
        const cronSecret = process.env.CRON_SECRET;
        const querySecret = req.query.secret;
        const authHeader = req.headers["authorization"];

        if (cronSecret && querySecret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await connectDB();

        const { processEmailQueue } = await import("../services/email-queue.service.js");

        console.log("[Cron] Email queue processing triggered");
        const stats = await processEmailQueue(10);

        const totalDuration = Date.now() - cronStart;
        console.log(
            `[Cron] Email queue run complete: fetched=${stats.fetched} sent=${stats.sent} failed=${stats.failed} duration=${totalDuration}ms`
        );

        res.json({
            message: "Email queue processed",
            ...stats,
            cronDurationMs: totalDuration,
        });
    } catch (err) {
        const totalDuration = Date.now() - cronStart;
        console.error("[Cron] Email queue error:", err.message, `duration=${totalDuration}ms`);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * GET /api/cron/auto-close-tickets
 *
 * Automatically closes SupportTickets that have been "resolved" for more than 7 days.
 * Can be triggered by cron-job.org or Vercel cron.
 */
router.get("/auto-close-tickets", async (req, res) => {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const querySecret = req.query.secret;
        const authHeader = req.headers["authorization"];

        if (cronSecret && querySecret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await connectDB();
        
        const SupportTicket = (await import("../models/SupportTicket.js")).default;
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const result = await SupportTicket.updateMany(
            {
                status: "resolved",
                resolvedAt: { $lt: sevenDaysAgo }
            },
            {
                $set: { status: "closed" },
                $push: {
                    events: {
                        type: 'statusChanged',
                        label: 'Ticket auto-closed after 7 days of inactivity',
                        from: 'resolved',
                        to: 'closed',
                        actorName: 'System',
                        actorRole: 'system',
                        createdAt: new Date()
                    }
                }
            }
        );

        res.json({
            message: "Ticket auto-close complete",
            closedCount: result.modifiedCount
        });
    } catch (err) {
        console.error("[Cron] Ticket auto-close error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;

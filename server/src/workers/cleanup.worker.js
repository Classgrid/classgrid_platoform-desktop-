import nodeCron from "node-cron";
import Notification from "../models/Notification.js";
import AttendanceSession from "../models/AttendanceSession.js";
import connectDB from "../../config/db.js";
import { processEmailQueue } from "../services/email-queue.service.js";
import { processDemoExpiryReminders } from "../services/demo-expiry-reminder.service.js";

/**
 * DAILY MAINTENANCE WORKER
 */
export const initCronJobs = () => {
    let isEmailQueueRunning = false;

    // 1. Cleanup old notifications (older than 30 days)
    nodeCron.schedule("0 0 * * *", async () => {
        console.log("[Cron] Running notification cleanup...");
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const result = await Notification.deleteMany({
                createdAt: { $lt: thirtyDaysAgo },
                isRead: true,
            });
            console.log(`[Cron] Cleaned up ${result.deletedCount} old notifications.`);
        } catch (err) {
            console.error("[Cron] Notification cleanup error:", err.message);
        }
    }, { timezone: "Asia/Kolkata" });

    // 2. Auto-expire any forgotten attendance sessions
    nodeCron.schedule("*/15 * * * *", async () => {
        console.log("[Cron] Checking for stale attendance sessions...");
        try {
            const result = await AttendanceSession.updateMany(
                { status: "active", expiresAt: { $lt: new Date() } },
                { $set: { status: "expired" } }
            );
            if (result.modifiedCount > 0) {
                console.log(`[Cron] Expired ${result.modifiedCount} stale attendance sessions.`);
            }
        } catch (err) {
            console.error("[Cron] Stale attendance cleanup error:", err.message);
        }
    }, { timezone: "Asia/Kolkata" });

    // 3. Process the transactional email queue every minute.
    nodeCron.schedule("* * * * *", async () => {
        if (isEmailQueueRunning) return;
        isEmailQueueRunning = true;

        try {
            await connectDB();
            const stats = await processEmailQueue(10);
            if (stats.fetched > 0 || stats.sent > 0 || stats.failed > 0) {
                console.log(`[Cron] Email queue processed in worker: fetched=${stats.fetched} sent=${stats.sent} failed=${stats.failed}`);
            }
        } catch (err) {
            console.error("[Cron] Email queue worker error:", err.message);
        } finally {
            isEmailQueueRunning = false;
        }
    }, { timezone: "Asia/Kolkata" });

    // 4. Check demo milestone reminders daily at 10:00 AM IST.
    nodeCron.schedule("0 10 * * *", async () => {
        console.log("[Cron] Running demo expiry reminder check...");
        try {
            await connectDB();
            const results = await processDemoExpiryReminders(new Date());
            console.log(`[Cron] Demo reminder check complete: checked=${results.checked} queued=${results.queued} skipped=${results.skipped}`);
            if (results.errors.length > 0) {
                console.warn("[Cron] Demo reminder check errors:", results.errors);
            }
        } catch (err) {
            console.error("[Cron] Demo reminder check error:", err.message);
        }
    }, { timezone: "Asia/Kolkata" });

    // 5. Auto-close resolved tickets after 30 minutes of inactivity (for testing)
    nodeCron.schedule("* * * * *", async () => {
        console.log("[Cron] Running ticket auto-close cleanup...");
        try {
            const SupportTicket = (await import("../models/SupportTicket.js")).default;

            const thirtyMinutesAgo = new Date();
            thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

            const result = await SupportTicket.updateMany(
                {
                    status: "resolved",
                    resolvedAt: { $lt: thirtyMinutesAgo }
                },
                {
                    $set: { status: "closed" },
                    $push: {
                        events: {
                            type: 'statusChanged',
                            label: 'Ticket auto-closed after 30 minutes of inactivity',
                            from: 'resolved',
                            to: 'closed',
                            actorName: 'System',
                            actorRole: 'system',
                            createdAt: new Date()
                        }
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`[Cron] Auto-closed ${result.modifiedCount} resolved tickets.`);
            }
        } catch (err) {
            console.error("[Cron] Ticket auto-close error:", err.message);
        }
    }, { timezone: "Asia/Kolkata" });

    console.log("Background cron jobs initialized successfully.");
};

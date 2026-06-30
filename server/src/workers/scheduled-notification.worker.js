import nodeCron from "node-cron";
import connectDB from "../../config/db.js";
import { processDueScheduledNotifications } from "../services/scheduled-notification.service.js";

export function initScheduledNotificationWorker() {
    let isRunning = false;

    nodeCron.schedule("* * * * *", async () => {
        if (isRunning) return;
        isRunning = true;

        try {
            await connectDB();
            const stats = await processDueScheduledNotifications();
            if (stats.checked > 0 || stats.sent > 0 || stats.failed > 0) {
                console.log(
                    `[ScheduledNotification] processed: checked=${stats.checked} sent=${stats.sent} failed=${stats.failed} skipped=${stats.skipped}`
                );
            }
        } catch (err) {
            console.error("[ScheduledNotification] worker error:", err.message);
        } finally {
            isRunning = false;
        }
    }, { timezone: "Asia/Kolkata" });

    console.log("Scheduled notification worker initialized.");
}
import nodeCron from "node-cron";
import connectDB from "../../config/db.js";
import { calculateOrganizationUsageDaily } from "../services/organization-usage-metering.service.js";

export function initOrganizationUsageDailyWorker() {
    let isRunning = false;

    nodeCron.schedule("20 0 * * *", async () => {
        if (isRunning) return;
        isRunning = true;

        try {
            await connectDB();
            const result = await calculateOrganizationUsageDaily({ date: new Date() });
            console.log(
                `[UsageDaily] complete: day=${result.day} inserted=${result.inserted} duplicateSkipped=${result.duplicateSkipped} r2Objects=${result.scannedR2Objects} unmapped=${result.unmappedR2Objects}`
            );
        } catch (err) {
            console.error("[UsageDaily] worker error:", err.message);
        } finally {
            isRunning = false;
        }
    }, { timezone: "Asia/Kolkata" });

    console.log("Organization daily usage worker initialized.");
}

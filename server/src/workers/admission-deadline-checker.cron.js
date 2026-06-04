import nodeCron from "node-cron";
import Organization from "../models/Organization.js";
import AdmissionApplication from "../models/AdmissionApplication.js";
import { ADMISSION_STAGES, promoteWaitlistInternal } from "../services/admissions/admission-workflow.service.js";
import seatMatrixService from "../services/admissions/seat-matrix.service.js";

/**
 * ADMISSION DEADLINE CHECKER CRON
 * Manages automated lapsing of seats and cleanup of stale applications.
 */
export const initAdmissionCronJobs = () => {
    // Runs at 01:00 AM every day
    nodeCron.schedule("0 1 * * *", async () => {
        console.log("[Admission Cron] Starting daily deadline checks...");
        try {
            const organizations = await Organization.find({ 
                "admission_config.is_portal_open": true 
            }).select("admission_config");

            for (const org of organizations) {
                const cutoffDate = org.admission_config?.cutoff_date;
                if (cutoffDate && new Date() > new Date(cutoffDate)) {
                    await handleLapsedSeats(org._id);
                }
                
                await cleanupStaleDrafts(org._id);
            }
            console.log("[Admission Cron] Daily checks completed.");
        } catch (err) {
            console.error("[Admission Cron] Error:", err.message);
        }
    });

    console.log("🚀 Admission Deadline Cron initialized.");
};

/**
 * Lapse unpaid seats for a specific organization.
 * Transitions fee_pending -> withdrawn and releases seats.
 */
async function handleLapsedSeats(orgId) {
    const lapsedApplications = await AdmissionApplication.find({
        organization_id: orgId,
        status: ADMISSION_STAGES.FEE_PENDING,
        fee_paid: false
    });

    if (lapsedApplications.length === 0) return;

    console.log(`[Admission Cron] Lapsing ${lapsedApplications.length} seats for org: ${orgId}`);

    for (const app of lapsedApplications) {
        app.status = ADMISSION_STAGES.WITHDRAWN;
        app.stage_history.push({
            status: ADMISSION_STAGES.WITHDRAWN,
            comment: "Seat lapsed automatically due to payment deadline."
        });
        await app.save();

        // Release the seat
        await seatMatrixService.releaseSeat(
            orgId,
            app.hierarchy_id,
            app.seat_type || "CAP",
            { suppressWaitlist: true }
        );

        // Trigger auto-promotion if enabled in org
        const org = await Organization.findById(orgId).select("admission_config");
        if (org.admission_config?.auto_promotion_enabled) {
            await promoteWaitlistInternal(orgId, app.hierarchy_id);
        }
    }
}

/**
 * Mark applications stale if draft is older than 15 days.
 */
async function cleanupStaleDrafts(orgId) {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const result = await AdmissionApplication.updateMany(
        {
            organization_id: orgId,
            status: ADMISSION_STAGES.DRAFT,
            updatedAt: { $lt: fifteenDaysAgo },
            is_deleted: false
        },
        { 
            $set: { is_deleted: true },
            $push: { stage_history: { status: "stale_cleanup", comment: "Marked as stale (draft > 15 days)." } }
        }
    );

    if (result.modifiedCount > 0) {
        console.log(`[Admission Cron] Marked ${result.modifiedCount} stale drafts as deleted for org: ${orgId}`);
    }
}

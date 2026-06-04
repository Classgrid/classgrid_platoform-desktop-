import cron from "node-cron";
import AdmissionApplication from "../../models/AdmissionApplication.js";
import Organization from "../../models/Organization.js";
import { ADMISSION_STAGES, promoteWaitlistInternal } from "./admission-workflow.service.js";
import { dispatchNotification } from "./admission-notification.service.js";

/**
 * admission-automation.service.js
 * 
 * Houses the background cron jobs and automated logic for Admissions:
 * 1. Seat Lapse Watcher (Lapses fee_pending seats after deadline)
 * 2. Auto-Promotion Engine (Promotes waitlisted students when seats open)
 * 3. Daily Admission Summary (Mails org admins)
 */

export const startAdmissionCrons = () => {
    console.log("🚀 [Admission Engine] Starting automation crons...");

    // 1. Run Fee Lapse Watcher & Auto-Promotion every midnight
    cron.schedule("0 0 * * *", async () => {
        console.log("🕒 [CRON] Running Waitlist & Fee Deadline Evaluator...");
        try {
            await enforceFeeDeadlinesAndAutoPromote();
        } catch (error) {
            console.error("❌ [CRON] Error in admission automation:", error);
        }
    });
};

/**
 * Enforces fee deadlines for all organizations where waitlist is enabled.
 * If a student in fee_pending has passed the org's cutoff_date for payment,
 * they are moved to withdrawn/lapsed, and the next waitlist candidate is promoted.
 */
export const enforceFeeDeadlinesAndAutoPromote = async () => {
    // 1. Find organizations with active portals and auto-promotion enabled
    const organizations = await Organization.find({
        "admission_config.is_portal_open": true,
        "admission_config.auto_promotion_enabled": true
    }).select("_id name admission_config");

    for (const org of organizations) {
        const orgId = org._id;
        const config = org.admission_config;

        if (!config.cutoff_date) continue; // No deadline set

        // 2. Find applications that are fee_pending past the cutoff deadline
        const lapsedApplications = await AdmissionApplication.find({
            organization_id: orgId,
            status: ADMISSION_STAGES.FEE_PENDING,
            updatedAt: { $lt: new Date(config.cutoff_date) }
        });

        for (const app of lapsedApplications) {
            // Mark as lapsed/withdrawn
            app.status = ADMISSION_STAGES.WITHDRAWN;
            app.stage_history.push({
                status: ADMISSION_STAGES.WITHDRAWN,
                comment: "System: Fee payment deadline passed. Seat lapsed."
            });
            await app.save();

            // Notify student
            await dispatchNotification("WITHDRAWN", {
                application: app,
                orgName: org.name,
                extra: "Failure to pay admission fees by the deadline."
            });

            // 3. Auto-promote the next waitlist candidate for this hierarchy
            await promoteWaitlistInternal(orgId, app.hierarchy_id, org.name);
        }
    }
};

export default {
    startAdmissionCrons,
    enforceFeeDeadlinesAndAutoPromote
};

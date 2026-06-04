import AdmissionApplication from "../../models/AdmissionApplication.js";
import SeatConfig from "../../models/SeatConfig.js";
import { ADMISSION_STAGES } from "./admission-workflow.service.js";

/**
 * waitlist.service.js
 * 
 * Auto-promotion engine that manages the waitlist for schools and junior colleges.
 * Grabs the highest merit candidate and provisions a seat when it becomes available.
 */
class WaitlistService {
    
    /**
     * Automatically promote the top N waitlisted students when seats free up.
     * 
     * @param {string} orgId 
     * @param {string} hierarchyId 
     * @param {string} quotaName 
     * @param {number} availableSeats 
     */
    async autoPromoteFromWaitlist(orgId, hierarchyId, quotaName, availableSeats = 1) {
        if (availableSeats <= 0) return { promotedCount: 0 };

        try {
            // 1. Fetch Top candidates ordered by merit score (Descending)
            const waitlistedCandidates = await AdmissionApplication.find({
                organization_id: orgId,
                hierarchy_id: hierarchyId,
                seat_type: quotaName,
                status: "waitlisted",
                is_deleted: false
            })
            .sort({ merit_score: -1, createdAt: 1 }) // Highest merit first, then earliest applied
            .limit(availableSeats);

            if (waitlistedCandidates.length === 0) {
                return { promotedCount: 0, message: "No candidates on the waitlist." };
            }

            let promotedCount = 0;

            for (const candidate of waitlistedCandidates) {
                
                // 2. Safely claim the seat from SeatConfig using optimistic currency control principles 
                //    (Though here we assume SeatMatrix released the seat prior, we sync the numbers)
                const seatUpdate = await SeatConfig.findOneAndUpdate(
                    {
                        organization_id: orgId,
                        hierarchy_id: hierarchyId,
                        "quotas.name": quotaName,
                        "quotas.waitlist_count": { $gt: 0 }
                    },
                    { 
                        $inc: { 
                            "quotas.$.filled": 1,
                            "quotas.$.waitlist_count": -1 
                        } 
                    },
                    { new: true }
                );

                if (!seatUpdate) {
                    console.warn(`[WaitlistEngine] Could not allocate seat for ${candidate._id}. Configuration error or negative waitlist.`);
                    break; // Stop promoting if seat config rejects
                }

                // 3. Update the candidate
                candidate.status = ADMISSION_STAGES.APPLIED;
                candidate.stage_history.push({
                    status: ADMISSION_STAGES.APPLIED,
                    comment: "AUTO-PROMOTED: Promoted from waitlist due to seat availability.",
                    timestamp: new Date()
                });

                await candidate.save();
                promotedCount++;

                // 4. (TODO) Trigger SMS/Email Notification
                // In production, trigger Brevo service here.
                console.log(`[WaitlistEngine] Candidate ${candidate.en_number || candidate.phone} promoted to Applied!`);
            }

            return { success: true, promotedCount };
            
        } catch (error) {
            console.error("❌ WaitlistService.autoPromote Error:", error);
            throw new Error("Failed to process waitlist promotion.");
        }
    }

    /**
     * Add a candidate to the waitlist safely (Incrementing SeatConfig waitlist metric)
     */
    async enforceWaitlist(applicationId, orgId, hierarchyId, quotaName) {
        const app = await AdmissionApplication.findById(applicationId);
        if (!app) throw new Error("Application not found");

        app.status = "waitlisted";
        app.stage_history.push({
            status: "waitlisted",
            comment: "Added to waitlist. No seats available at the moment.",
            timestamp: new Date()
        });

        await app.save();

        await SeatConfig.findOneAndUpdate(
            { organization_id: orgId, hierarchy_id: hierarchyId, "quotas.name": quotaName },
            { $inc: { "quotas.$.waitlist_count": 1 } }
        );

        return { success: true, status: "waitlisted" };
    }
}

export default new WaitlistService();

import AdmissionApplication from "../models/AdmissionApplication.js";
import SeatConfig from "../models/SeatConfig.js";
import { getIO } from "../services/socket.service.js";

/**
 * GET /api/admission/broadcast/merit-list/:hierarchyId
 * Returns the live ranked list of candidates for a specific branch/class.
 * Used for "Spot Round" projector displays.
 */
export const getLiveMeritList = async (req, res) => {
    try {
        const { hierarchyId } = req.params;
        const orgId = req.user.organization_id;

        // Fetch applications for this hierarchy node that are 'verified' or 'fee_pending'
        // Sorted by Percentile / Merit Score DESC
        const candidates = await AdmissionApplication.find({
            organization_id: orgId,
            hierarchy_id: hierarchyId, 
            status: { $in: ["verified", "fee_pending", "applied", "under_verification"] }
        })
        .select("full_name en_number merit_score status student_id is_called")
        .sort({ merit_score: -1, createdAt: 1 }) // Tie-breaker: earlier submission
        .lean();

        res.json({ success: true, candidates });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch merit list" });
    }
};

/**
 * Admin: Call a candidate to the desk
 * POST /api/admission/broadcast/call-candidate
 */
export const callCandidate = async (req, res) => {
    try {
        const { application_id } = req.body;
        const orgId = req.user.organization_id;

        const application = await AdmissionApplication.findOneAndUpdate(
            { _id: application_id, organization_id: orgId },
            { 
                $set: { is_called: true, called_at: new Date() }
            },
            { new: true }
        );

        if (!application) return res.status(404).json({ error: "Application not found" });

        // Broadcast to projectors
        import("../services/admissions/seat-matrix.service.js").then(service => {
            service.default.broadcastUpdate(orgId, "CANDIDATE_CALLED", {
                application_id,
                full_name: application.full_name,
                merit_score: application.merit_score
            });
        });

        res.json({ success: true, message: `Called ${application.full_name}` });
    } catch (err) {
        res.status(500).json({ error: "Failed to call candidate" });
    }
};

/**
 * GET /api/admission/broadcast/seat-matrix
 * Returns the live seat availability for all branches.
 */
export const getLiveSeatMatrix = async (req, res) => {
    try {
        const orgId = req.user.organization_id;
        const matrix = await SeatConfig.find({ organization_id: orgId, is_active: true })
            .populate("hierarchy_id", "name level_type code")
            .lean();

        res.json({ success: true, matrix });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch seat matrix" });
    }
};

/**
 * Internal Helper: broadcastAdmissionUpdate
 * Emits a socket event to update all projectors/waiting rooms.
 */
export const broadcastAdmissionUpdate = (orgId, type, data) => {
    const io = getIO();
    if (io) {
        // org-specific room for security
        io.to(`org_${orgId}_admission`).emit("ADMISSION_LIVE_UPDATE", {
            type, // 'SEAT_TAKEN' | 'CANDIDATE_CALLED' | 'ADMISSION_CONFIRMED'
            data,
            timestamp: new Date()
        });
    }
};

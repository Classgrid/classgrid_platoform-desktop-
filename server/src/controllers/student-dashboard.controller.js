import { getStudentDashboardSummary } from "../services/student-dashboard.service.js";

/**
 * Controller to handle fetching all metrics, schedule, and announcements for the Student Dashboard.
 * @param {object} req - Express Request object
 * @param {object} res - Express Response object
 */
export const getStudentDashboardData = async (req, res) => {
  try {
    // 1. Extract context from middleware
    const studentId = req.user._id;
    const orgId = req.institutionOrganization?._id || req.user.organization_id;
    const profile = req.institutionProfile; // Respecting the full 4x2 profile we locked in earlier!

    if (!orgId || !studentId) {
      return res.status(400).json({ success: false, message: "Missing required organization or user context." });
    }

    // 2. Pass context to the Service Layer
    const data = await getStudentDashboardSummary(studentId, orgId, profile);

    // 3. Format Response
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[student-dashboard.controller] Error in getStudentDashboardData:", error);
    return res.status(500).json({ success: false, message: "Internal server error while fetching student dashboard." });
  }
};

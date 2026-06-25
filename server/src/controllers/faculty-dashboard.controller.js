import { getFacultyDashboardSummary } from "../services/faculty-dashboard.service.js";

/**
 * Controller to handle fetching all metrics, schedule, and announcements for the Faculty Dashboard.
 * @param {object} req - Express Request object
 * @param {object} res - Express Response object
 */
export const getFacultyDashboardData = async (req, res) => {
  try {
    // 1. Extract context from middleware
    const facultyId = req.user._id;
    const orgId = req.institutionOrganization?._id || req.user.organization_id;
    const profile = req.institutionProfile; // Passing the full profile to fully respect the 4x2 DNA!

    if (!orgId || !facultyId) {
      return res.status(400).json({ success: false, message: "Missing required organization or user context." });
    }

    // 2. Pass context to the Service Layer
    const data = await getFacultyDashboardSummary(facultyId, orgId, profile);

    // 3. Format Response
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[faculty-dashboard.controller] Error in getFacultyDashboardData:", error);
    return res.status(500).json({ success: false, message: "Internal server error while fetching faculty dashboard." });
  }
};

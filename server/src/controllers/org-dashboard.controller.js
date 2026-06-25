import { getDashboardSummary } from "../services/org-dashboard.service.js";

/**
 * Controller to fetch organization dashboard overview metrics.
 * Responsible for extracting request context and formatting the API response.
 */
export const getOrgDashboardMetrics = async (req, res) => {
  try {
    // 1. Extract context from middleware
    const orgId = req.institutionOrganization?._id || req.user.organization_id;
    const profile = req.institutionProfile;

    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is missing from request context." });
    }

    // 2. Pass to Service Layer
    const data = await getDashboardSummary(orgId, profile);

    // 3. Format Response
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[org-dashboard.controller] Error fetching metrics:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred while fetching organization dashboard metrics."
    });
  }
};

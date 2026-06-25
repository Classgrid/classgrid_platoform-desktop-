import User from "../models/User.js";
import Classroom from "../models/Classroom.js";
import Organization from "../models/Organization.js";

/**
 * Calculates core overview metrics for the organization dashboard.
 * @param {string} orgId - The Organization ID
 * @param {object} profile - The institution profile (for 4x2 rule evaluation)
 * @returns {Promise<object>}
 */
export const getDashboardSummary = async (orgId, profile = {}) => {
  try {
    // Run all aggregations in parallel for maximum performance
    const [totalStudents, totalFaculty, totalClassrooms] = await Promise.all([
      User.countDocuments({ organization_id: orgId, role: "student", status: "active" }),
      User.countDocuments({ organization_id: orgId, role: { $in: ["teacher", "faculty"] }, status: "active" }),
      Classroom.countDocuments({ organization_id: orgId, "settings.isArchived": false })
    ]);

    // 4x2 Rule Logic: Handle "4" Org Types and "2" Structural Variants (With/Without Divisions)
    let structureMetric = 0;
    
    const isCoaching = profile?.dashboardVariant === "coaching";
    const hasDivisions = profile?.structureFeatures?.hasDivisions || profile?.structureFeatures?.hasBatches;

    if (hasDivisions) {
      if (isCoaching) {
        // Coaching WITH divisions (Batches)
        structureMetric = await Classroom.distinct("sub_batch", { organization_id: orgId }).then(res => res.length);
      } else {
        // School/College WITH divisions
        structureMetric = await Classroom.distinct("division", { organization_id: orgId }).then(res => res.length);
      }
    } else {
      // Organization WITHOUT divisions - we just count the total unique standards or courses
      if (isCoaching) {
        structureMetric = await Classroom.distinct("entrance_course", { organization_id: orgId }).then(res => res.length);
      } else {
        structureMetric = await Classroom.distinct("standard", { organization_id: orgId }).then(res => res.length);
      }
    }

    const structureMetricLabel = isCoaching 
      ? (hasDivisions ? "Total Batches" : "Total Courses")
      : (hasDivisions ? "Total Divisions" : "Total Standards");

    return {
      totalStudents,
      totalFaculty,
      totalClassrooms,
      structureMetric,
      structureMetricLabel,
    };
  } catch (error) {
    console.error("[org-dashboard.service] Error calculating dashboard summary:", error);
    throw new Error("Failed to calculate organization dashboard summary.");
  }
};


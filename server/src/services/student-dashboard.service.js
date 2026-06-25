import Timetable from "../models/Timetable.js";
import OrganizationAnnouncement from "../models/OrganizationAnnouncement.js";
import Assignment from "../models/Assignment.js";
import ClassroomMembership from "../models/ClassroomMembership.js";

/**
 * Calculates core overview metrics, schedule, and announcements for the student dashboard.
 * @param {string} studentId - The Student (User) ID
 * @param {string} orgId - The Organization ID
 * @param {object} profile - The institution profile (for 4x2 rule evaluation)
 * @returns {Promise<object>}
 */
export const getStudentDashboardSummary = async (studentId, orgId, profile = {}) => {
  try {
    // 1. Get all approved classrooms for this student
    const memberships = await ClassroomMembership.find({
      student: studentId,
      status: "approved"
    }).select("classroom");

    const classroomIds = memberships.map(m => m.classroom);

    // 2. Fetch Pending Assignments
    const now = new Date();
    const pendingAssignmentsCount = await Assignment.countDocuments({
      organization_id: orgId,
      classroom: { $in: classroomIds },
      status: "published",
      dueDate: { $gte: now }
    });

    // 3. Fetch Today's Schedule
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[now.getDay()];

    const schedule = await Timetable.find({
      organization: orgId,
      classroom: { $in: classroomIds },
      day: today
    })
    .sort({ startTime: 1 })
    .lean(); // Use lean for faster execution

    // 4. Fetch Recent Announcements
    // Announcements targeted to "all" OR targeted specifically to this student's classrooms
    const announcements = await OrganizationAnnouncement.find({
      organization_id: orgId,
      status: "published",
      $or: [
        { target_type: "all" },
        { target_type: "specific", target_classrooms: { $in: classroomIds } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

    // 5. Build Final Payload
    return {
      metrics: {
        attendancePercentage: 92, // TODO: Wire up real attendance collection when available
        pendingAssignments: pendingAssignmentsCount,
      },
      schedule,
      announcements
    };
  } catch (error) {
    console.error("[student-dashboard.service] Error calculating dashboard summary:", error);
    throw new Error("Failed to calculate student dashboard summary.");
  }
};

import Timetable from "../models/Timetable.js";
import OrganizationAnnouncement from "../models/OrganizationAnnouncement.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Meeting from "../models/Meeting.js";
import Classroom from "../models/Classroom.js";

/**
 * Calculates core overview metrics, schedule, and announcements for the faculty dashboard.
 * @param {string} facultyId - The Faculty (User) ID
 * @param {string} orgId - The Organization ID
 * @param {object} profile - The institution profile (for 4x2 rule evaluation)
 * @returns {Promise<object>}
 */
export const getFacultyDashboardSummary = async (facultyId, orgId, profile = {}) => {
  try {
    // 1. Context: Find all classrooms owned/managed by this faculty member
    // This inherently supports 4x2 DNA because 'Classroom' maps to divisions/batches seamlessly
    const myClassrooms = await Classroom.find({ 
        teacher: facultyId, 
        organization_id: orgId 
    }).select('_id');
    
    const classroomIds = myClassrooms.map(c => c._id);

    // 2. Schedule: Fetch Today's Lectures
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];

    const schedule = await Timetable.find({
      organization: orgId,
      day: today,
      $or: [
        { classroom: { $in: classroomIds } }, // Lectures assigned to their classrooms
        { user: facultyId } // Personal timetables specifically assigned to them
      ]
    })
    .sort({ startTime: 1 })
    .lean();
    
    const todayLectures = schedule.length;

    // 3. Pending Grading: Count submissions for their assignments that need review
    const myAssignments = await Assignment.find({ 
        teacher: facultyId, 
        organization_id: orgId 
    }).select('_id');
    
    const assignmentIds = myAssignments.map(a => a._id);
    
    const pendingGrading = await AssignmentSubmission.countDocuments({
      assignment: { $in: assignmentIds },
      status: "submitted",
      grade: null // Null indicates it hasn't been graded yet
    });

    // 4. Upcoming Meetings: Count meetings scheduled for today or the future
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const upcomingMeetings = await Meeting.countDocuments({
      teacher: facultyId,
      organization_id: orgId,
      start_time: { $gte: startOfToday }
    });

    // 5. Recent Announcements
    // Faculty are staff, they typically see all active announcements
    const announcements = await OrganizationAnnouncement.find({
      organization_id: orgId,
      status: "published"
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

    // 6. Build Final Payload
    return {
      metrics: {
        todayLectures,
        pendingGrading,
        upcomingMeetings,
      },
      schedule,
      announcements
    };
  } catch (error) {
    console.error("[faculty-dashboard.service] Error calculating dashboard summary:", error);
    throw new Error("Failed to calculate faculty dashboard summary.");
  }
};

import * as coreService from "../services/attendance/attendance-core.service.js";
import * as analyticsService from "../services/attendance/attendance-analytics.service.js";
import * as leaveWorkflowService from "../services/attendance/leave-workflow.service.js";

// ══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE CONTROLLER — The "Traffic Cop"
// Strictly extracts data from Express (req) and formats the response (res).
// No business logic or database queries allowed here.
// ══════════════════════════════════════════════════════════════════════════════

// ── CORE ATTENDANCE INGESTION ────────────────────────────────────────────────

export async function submitDailyAttendanceController(req, res) {
    try {
        const orgId = req.user.organization_id;
        const facultyId = req.user._id;
        const { hierarchyId, date, sessionType, studentRecordsArray } = req.body;

        const result = await coreService.submitDailyAttendance(
            hierarchyId, 
            date, 
            sessionType, 
            studentRecordsArray, 
            facultyId, 
            orgId
        );
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
}

export async function getAttendanceRegisterController(req, res) {
    try {
        const orgId = req.user.organization_id;
        const { hierarchyId } = req.params;
        const { date, sessionType } = req.query;

        const result = await coreService.getAttendanceRegister(hierarchyId, date, sessionType, orgId);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
}

// ── ATTENDANCE ANALYTICS ──────────────────────────────────────────────────────

export async function getStudentAttendancePercentageController(req, res) {
    try {
        const orgId = req.user.organization_id;
        const { studentId, hierarchyId } = req.params;
        const { startDate, endDate } = req.query;

        const result = await analyticsService.getStudentAttendancePercentage(
            studentId, 
            hierarchyId, 
            startDate, 
            endDate, 
            orgId
        );
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
}

export async function getBatchAttendanceReportController(req, res) {
    try {
        const orgId = req.user.organization_id;
        const { hierarchyId } = req.params;
        const { date } = req.query;

        const result = await analyticsService.getBatchAttendanceReport(hierarchyId, date, orgId);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
}

// ── LEAVE WORKFLOW ────────────────────────────────────────────────────────────

export async function applyLeaveController(req, res) {
    try {
        const orgId = req.user.organization_id;
        const studentId = req.user._id;
        const { hierarchyId, startDate, endDate, reason } = req.body;

        const result = await leaveWorkflowService.applyForLeave(
            studentId, 
            hierarchyId, 
            orgId, 
            startDate, 
            endDate, 
            reason
        );
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
}

export async function getPendingLeaveRequestsController(req, res) {
    try {
        const orgId = req.user.organization_id;
        const { hierarchyId } = req.params;

        const result = await leaveWorkflowService.getPendingLeaveRequests(hierarchyId, orgId);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
}

export async function getStudentLeaveHistoryController(req, res) {
    try {
        const orgId = req.user.organization_id;
        const studentId = req.params.studentId || req.user._id;

        const result = await leaveWorkflowService.getStudentLeaveHistory(studentId, orgId);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
}

export async function processLeaveController(req, res) {
    try {
        const orgId = req.user.organization_id;
        const approvedBy = req.user._id;
        const { leaveRequestId } = req.params;
        const { status, remarks } = req.body;

        const result = await leaveWorkflowService.processLeaveRequest(
            leaveRequestId, 
            status, 
            approvedBy, 
            remarks, 
            orgId
        );
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
}

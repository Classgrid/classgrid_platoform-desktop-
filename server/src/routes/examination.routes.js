import express from "express";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";
import { attachInstitutionProfile } from "../middleware/institution-profile.middleware.js";
import {
    createExamController,
    getFacultyExamsController,
    getStudentExamsController,
    getExamByIdController,
    updateExamController,
    deleteExamController,
    getExamsByOrganizationController,
    submitStudentGradeController,
    bulkSubmitGradesController,
    getExamResultsController,
    getStudentResultsFeedController,
    generateStudentReportCardController,
    generateBatchReportController
} from "../controllers/examination.controller.js";

const router = express.Router();

// Apply these to all routes in this file (must be logged in, must load the DNA profile)
router.use(isAuthenticated, attachInstitutionProfile({ required: false }));

// ══════════════════════════════════════════════════════════════════════════════
// EXAM CORE ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// Admin / Faculty: Create a new exam
router.post("/create", requireRole(["faculty", "org_admin"]), createExamController);

// Admin / Faculty: Get exams created by the logged-in faculty
router.get("/faculty", requireRole(["faculty", "org_admin"]), getFacultyExamsController);

// Student: Get feed of exams targeted at their hierarchy nodes (Uses POST to accept array in body)
router.post("/student", requireRole("student"), getStudentExamsController);

// Admin: Get all exams for the organization (Bento Grid Dashboard)
router.get("/org", requireRole("org_admin"), getExamsByOrganizationController);

// All Authenticated: Get a specific exam by ID
router.get("/exam/:examId", getExamByIdController);

// Admin / Faculty: Update an exam (must be creator, must be draft/scheduled)
router.put("/exam/:examId", requireRole(["faculty", "org_admin"]), updateExamController);

// Admin / Faculty: Delete an exam (must be creator, must be draft)
router.delete("/exam/:examId", requireRole(["faculty", "org_admin"]), deleteExamController);

// ══════════════════════════════════════════════════════════════════════════════
// GRADING ENGINE ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// Admin / Faculty: Bulk submit grades for a batch
router.post("/exam/:examId/grade/bulk", requireRole(["faculty", "org_admin"]), bulkSubmitGradesController);

// Admin / Faculty: Submit/update grade for a single student
router.post("/exam/:examId/grade/:studentId", requireRole(["faculty", "org_admin"]), submitStudentGradeController);

// Admin / Faculty: View the completed gradebook for an exam
router.get("/exam/:examId/results", requireRole(["faculty", "org_admin"]), getExamResultsController);

// All Authenticated: View a student's graded exams feed
router.get("/student/:studentId/results", getStudentResultsFeedController);

// ══════════════════════════════════════════════════════════════════════════════
// REPORT CARD ENGINE ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// All Authenticated: Generate cumulative report card for a student in a specific term/hierarchy
router.get("/report-card/student/:studentId/hierarchy/:hierarchyId", generateStudentReportCardController);

// Admin / Faculty: Generate the master batch report (Toppers, Failures, Averages)
router.get("/report-card/batch/:hierarchyId", requireRole(["faculty", "org_admin"]), generateBatchReportController);

export default router;

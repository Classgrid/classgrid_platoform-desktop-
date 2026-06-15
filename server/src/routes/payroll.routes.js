import express from "express";
import { calculatePayroll, getPayrollSummary, getMyPayslip } from "../controllers/payroll.controller.js";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";
import { attachInstitutionProfile } from "../middleware/institution-profile.middleware.js";

const router = express.Router();

router.use(isAuthenticated, attachInstitutionProfile({ required: false }));

router.get("/institution-profile", attachInstitutionProfile(), (req, res) => {
    res.json({
        institution_profile: req.institutionProfile,
        staff_assignment_profile: req.institutionProfile.staffAssignmentProfile,
        learner_record_profile: req.institutionProfile.learnerRecordProfile,
    });
});

// Admin limits
router.post("/calculate", requireRole("org_admin", "super_admin"), calculatePayroll);
router.get("/summary", requireRole("org_admin", "super_admin"), getPayrollSummary);

// Faculty personal route
router.get("/me", requireRole("faculty", "teacher", "org_admin"), getMyPayslip);

export default router;

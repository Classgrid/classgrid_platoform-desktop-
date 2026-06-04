import express from "express";
import { calculatePayroll, getPayrollSummary, getMyPayslip } from "../controllers/payroll.controller.js";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(isAuthenticated);

// Admin limits
router.post("/calculate", requireRole("org_admin", "super_admin"), calculatePayroll);
router.get("/summary", requireRole("org_admin", "super_admin"), getPayrollSummary);

// Faculty personal route
router.get("/me", requireRole("faculty", "teacher", "org_admin"), getMyPayslip);

export default router;

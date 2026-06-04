import { generatePayrollForMonth } from "../services/payroll.service.js";
import FacultyPayroll from "../models/FacultyPayroll.js";

/**
 * Trigger manual calculation of payroll.
 * POST /api/payroll/calculate
 * Body: { month: "2026-04" }
 */
export const calculatePayroll = async (req, res) => {
    try {
        const { month } = req.body;
        const orgId = req.user.organization_id;

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ success: false, message: "Invalid month format. Use YYYY-MM." });
        }

        const results = await generatePayrollForMonth(orgId, month);

        res.status(200).json({
            success: true,
            message: `Payroll calculation complete for ${month}.`,
            data: { recordsProcessed: results.length }
        });
    } catch (error) {
        console.error("Payroll calculation error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Get Org-wide payroll summary for a month
 * GET /api/payroll/summary?month=2026-04
 */
export const getPayrollSummary = async (req, res) => {
    try {
        const { month } = req.query;
        const orgId = req.user.organization_id;

        if (!month) {
            return res.status(400).json({ success: false, message: "Month is required." });
        }

        const payrolls = await FacultyPayroll.find({ organization: orgId, month })
            .populate("faculty", "name email prn");

        res.status(200).json({
            success: true,
            data: payrolls
        });
    } catch (error) {
        console.error("Payroll summary error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Get individual payslip
 * GET /api/payroll/me?month=2026-04
 */
export const getMyPayslip = async (req, res) => {
    try {
        const { month } = req.query;
        const orgId = req.user.organization_id;
        const facultyId = req.user._id;

        if (!month) {
            return res.status(400).json({ success: false, message: "Month is required." });
        }

        const payslip = await FacultyPayroll.findOne({ organization: orgId, faculty: facultyId, month });

        if (!payslip) {
            return res.status(404).json({ success: false, message: "Payslip not found." });
        }

        res.status(200).json({
            success: true,
            data: payslip
        });
    } catch (error) {
        console.error("My payslip error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

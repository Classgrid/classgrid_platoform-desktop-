import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { primarySupabaseClient as supabase } from "../config/supabaseClient.js";

const router = express.Router();

const ALLOWED_FIELDS = [
    "school_name",
    "branch_department",
    "class_year",
    "course_name",
    "batch_year",
    "semester",
    "division_section",
    "roll_number",
    "prn",
    "admission_number",
];

// ─────────────────────────────────────────────
// GET — Fetch student's academic info
// ─────────────────────────────────────────────
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id.toString();

        const { data, error } = await supabase
            .from("student_academic_info")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

        if (error) throw error;

        // Return empty defaults if no record exists yet
        res.json({
            academicInfo: data || {
                school_name: "",
                branch_department: "",
                class_year: "",
                course_name: "",
                batch_year: "",
                semester: "",
                division_section: "",
                roll_number: "",
                prn: "",
                admission_number: "",
            },
        });
    } catch (err) {
        console.error("GET academic info error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// PUT — Upsert student's academic info
// ─────────────────────────────────────────────
router.put("/", isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id.toString();

        // Sanitise: only allow known fields, trim strings
        const updates = {};
        for (const field of ALLOWED_FIELDS) {
            if (req.body[field] !== undefined) {
                updates[field] = (req.body[field] || "").toString().trim().substring(0, 200);
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields provided" });
        }

        // Upsert: insert if not exists, update if exists (keyed on user_id)
        const { data, error } = await supabase
            .from("student_academic_info")
            .upsert(
                { user_id: userId, ...updates },
                { onConflict: "user_id" }
            )
            .select()
            .single();

        if (error) throw error;

        res.json({ message: "Academic info saved", academicInfo: data });
    } catch (err) {
        console.error("PUT academic info error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;

import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/admission-roles.middleware.js";
import Lead from "../models/Lead.js";
import connectDB from "../../config/db.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════════
// COACHING CENTER MINI-CRM: Lead Pipeline
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/crm/leads — Create a new lead
 */
router.post("/leads", isAuthenticated, requireRole(["org_admin", "counselor", "fee_manager", "admission_head"]), async (req, res) => {
    try {
        await connectDB();
        const orgId = req.user.organization_id;
        const { student_name, parent_name, phone, email, source, interested_course, interested_batch, current_class, notes } = req.body;

        if (!student_name || !phone) {
            return res.status(400).json({ error: "Student name and phone are required." });
        }

        // Check for existing lead with same phone in this org
        const existing = await Lead.findOne({ organization_id: orgId, phone, is_deleted: false });
        if (existing) {
            return res.status(409).json({ error: "A lead with this phone number already exists.", existing_stage: existing.stage });
        }

        const lead = await Lead.create({
            organization_id: orgId,
            student_name,
            parent_name,
            phone,
            email,
            source: source || "walk_in",
            interested_course,
            interested_batch,
            current_class,
            assigned_to: req.user._id,
            follow_up_notes: notes ? [{ note: notes, by: req.user._id }] : [],
        });

        res.status(201).json({ success: true, lead });
    } catch (err) {
        console.error("Create Lead Error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/crm/leads — List leads with pipeline filtering
 */
router.get("/leads", isAuthenticated, requireRole(["org_admin", "counselor", "fee_manager", "admission_head"]), async (req, res) => {
    try {
        await connectDB();
        const orgId = req.user.organization_id;
        const { stage, assigned_to, source, page = 1, limit = 50 } = req.query;

        const filter = { organization_id: orgId, is_deleted: false };
        if (stage) filter.stage = stage;
        if (assigned_to) filter.assigned_to = assigned_to;
        if (source) filter.source = source;

        const total = await Lead.countDocuments(filter);
        const leads = await Lead.find(filter)
            .populate("assigned_to", "name")
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Pipeline summary
        const pipeline = await Lead.aggregate([
            { $match: { organization_id: req.user.organization_id, is_deleted: false } },
            { $group: { _id: "$stage", count: { $sum: 1 } } },
        ]);

        res.json({ success: true, leads, total, pipeline });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * PATCH /api/crm/leads/:id/stage — Update lead stage
 */
router.patch("/leads/:id/stage", isAuthenticated, requireRole(["org_admin", "counselor", "fee_manager"]), async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { stage, note } = req.body;

        const lead = await Lead.findOne({ _id: id, organization_id: req.user.organization_id, is_deleted: false });
        if (!lead) return res.status(404).json({ error: "Lead not found." });

        lead.stage = stage;
        if (stage === "converted") lead.converted_at = new Date();
        if (note) {
            lead.follow_up_notes.push({ note, by: req.user._id });
        }
        await lead.save();

        res.json({ success: true, lead });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * PATCH /api/crm/leads/:id/follow-up — Add follow-up note + set next date
 */
router.patch("/leads/:id/follow-up", isAuthenticated, requireRole(["org_admin", "counselor", "fee_manager"]), async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { note, next_follow_up } = req.body;

        const lead = await Lead.findOne({ _id: id, organization_id: req.user.organization_id, is_deleted: false });
        if (!lead) return res.status(404).json({ error: "Lead not found." });

        if (note) lead.follow_up_notes.push({ note, by: req.user._id });
        if (next_follow_up) lead.next_follow_up = new Date(next_follow_up);
        await lead.save();

        res.json({ success: true, lead });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/crm/leads/due-today — Get leads needing follow-up today
 */
router.get("/leads/due-today", isAuthenticated, requireRole(["org_admin", "counselor"]), async (req, res) => {
    try {
        await connectDB();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const due = await Lead.find({
            organization_id: req.user.organization_id,
            is_deleted: false,
            next_follow_up: { $gte: today, $lt: tomorrow },
            stage: { $nin: ["enrolled", "dropped", "not_interested"] },
        }).populate("assigned_to", "name").lean();

        res.json({ success: true, count: due.length, leads: due });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/crm/leads/:id — Soft delete a lead
 */
router.delete("/leads/:id", isAuthenticated, requireRole(["org_admin"]), async (req, res) => {
    try {
        await connectDB();
        await Lead.findOneAndUpdate(
            { _id: req.params.id, organization_id: req.user.organization_id },
            { is_deleted: true }
        );
        res.json({ success: true, message: "Lead deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

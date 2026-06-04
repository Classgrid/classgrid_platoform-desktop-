import express from "express";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";
import Changelog from "../models/Changelog.js";

const router = express.Router();

// ══════════════════════════════════════════════════════════════
//  GET /api/changelog — All published entries (for all users)
// ══════════════════════════════════════════════════════════════
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const entries = await Changelog.find({ isPublished: true })
            .sort({ publishedAt: -1 })
            .limit(30)
            .populate("createdBy", "name")
            .lean();

        res.json({ success: true, entries });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  POST /api/changelog/react — React to a changelog entry
// ══════════════════════════════════════════════════════════════
router.post("/react", isAuthenticated, async (req, res) => {
    try {
        const { entryId, emoji } = req.body;
        if (!entryId || !emoji) return res.status(400).json({ success: false, message: "entryId and emoji required" });

        const entry = await Changelog.findById(entryId);
        if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

        const userId = req.user._id;

        // Check if already reacted with this emoji
        const existingIdx = entry.reactedBy.findIndex(
            r => r.userId.toString() === userId.toString() && r.emoji === emoji
        );

        if (existingIdx > -1) {
            // Remove reaction
            entry.reactedBy.splice(existingIdx, 1);
            const current = entry.reactions.get(emoji) || 0;
            if (current <= 1) {
                entry.reactions.delete(emoji);
            } else {
                entry.reactions.set(emoji, current - 1);
            }
        } else {
            // Add reaction
            entry.reactedBy.push({ userId, emoji });
            const current = entry.reactions.get(emoji) || 0;
            entry.reactions.set(emoji, current + 1);
        }

        await entry.save();
        res.json({ success: true, reactions: Object.fromEntries(entry.reactions) });
    } catch (err) {
        console.error("[Changelog] React error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  SUPER ADMIN: POST /api/changelog/create — Create entry
// ══════════════════════════════════════════════════════════════
router.post("/create", isAuthenticated, requireRole("super_admin"), async (req, res) => {
    try {
        const { version, title, body, type, highlights, isPublished } = req.body;
        if (!version || !title || !body) {
            return res.status(400).json({ success: false, message: "version, title, and body are required" });
        }

        const entry = await Changelog.create({
            version,
            title,
            body,
            type: type || "feature",
            highlights: highlights || [],
            isPublished: isPublished !== false,
            createdBy: req.user._id,
            publishedAt: new Date()
        });

        res.status(201).json({ success: true, message: "Changelog entry created", entry });
    } catch (err) {
        console.error("[Changelog] Create error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  SUPER ADMIN: PUT /api/changelog/:id — Update entry
// ══════════════════════════════════════════════════════════════
router.put("/:id", isAuthenticated, requireRole("super_admin"), async (req, res) => {
    try {
        const { version, title, body, type, highlights, isPublished } = req.body;

        const entry = await Changelog.findByIdAndUpdate(
            req.params.id,
            { version, title, body, type, highlights, isPublished },
            { new: true }
        );

        if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

        res.json({ success: true, message: "Entry updated", entry });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ══════════════════════════════════════════════════════════════
//  SUPER ADMIN: DELETE /api/changelog/:id — Delete entry
// ══════════════════════════════════════════════════════════════
router.delete("/:id", isAuthenticated, requireRole("super_admin"), async (req, res) => {
    try {
        await Changelog.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Entry deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;

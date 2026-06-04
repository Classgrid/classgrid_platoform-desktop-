import express from "express";
import { getChatSb } from "../config/supabaseClient.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import connectDB from "../../config/db.js";
import Notification from "../models/Notification.js";

const router = express.Router();

// Centralized Supabase Client
const sb = getChatSb();

// GET all notifications for current user — MERGES Supabase + MongoDB
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const myId = req.user._id.toString();
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

        // 1️⃣ Fetch from Supabase (legacy notifications)
        let supaNotifs = [];
        try {
            const { data, error } = await sb
                .from('notifications')
                .select('*')
                .eq('recipient_id', myId)
                .gte('created_at', threeDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(20);
            if (!error && data) {
                supaNotifs = data.map(n => ({
                    _id: n.id,
                    type: n.type || "system",
                    title: n.title || "",
                    message: n.message || "",
                    link: n.link || "",
                    relatedId: n.related_id || "",
                    isRead: n.is_read || false,
                    createdAt: n.created_at,
                    source: "supabase",
                }));
            }
        } catch (e) {
            console.error("[Notifications] Supabase fetch error:", e.message);
        }

        // 2️⃣ Fetch from MongoDB (attendance, quiz, assignment notifications)
        let mongoNotifs = [];
        try {
            await connectDB();
            const mongoData = await Notification.find({
                recipient: req.user._id,
                createdAt: { $gte: threeDaysAgo }
            })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            mongoNotifs = mongoData.map(n => ({
                _id: n._id.toString(),
                type: n.type || "system",
                title: n.title || "",
                message: n.message || "",
                link: n.link || "",
                relatedId: n.relatedId || "",
                isRead: n.isRead || false,
                createdAt: n.createdAt,
                source: "mongo",
            }));
        } catch (e) {
            console.error("[Notifications] MongoDB fetch error:", e.message);
        }

        // 3️⃣ Merge, sort by date, limit to 30
        const allNotifs = [...supaNotifs, ...mongoNotifs]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 30);

        const unreadCount = allNotifs.filter(n => !n.isRead).length;

        res.json({ notifications: allNotifs, unreadCount });
    } catch (err) {
        console.error("Fetch notifications error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Mark notification as read (handles both Supabase and MongoDB)
router.put("/:id/read", isAuthenticated, async (req, res) => {
    try {
        const notifId = req.params.id;

        // Try MongoDB first (ObjectId format = 24 hex chars)
        if (/^[0-9a-fA-F]{24}$/.test(notifId)) {
            try {
                await connectDB();
                const updated = await Notification.findByIdAndUpdate(notifId, { isRead: true });
                if (updated) return res.json({ message: "Marked read" });
            } catch (e) { /* fallthrough to Supabase */ }
        }

        // Try Supabase
        const { error } = await sb
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notifId);

        if (error) throw error;
        res.json({ message: "Marked read" });
    } catch (err) {
        console.error("Mark read error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Mark all as read (both Supabase and MongoDB)
router.put("/read-all", isAuthenticated, async (req, res) => {
    try {
        // Supabase
        await sb
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', req.user._id.toString())
            .eq('is_read', false);

        // MongoDB
        try {
            await connectDB();
            await Notification.updateMany(
                { recipient: req.user._id, isRead: false },
                { isRead: true }
            );
        } catch (e) {
            console.error("[Notifications] Mongo mark-all-read error:", e.message);
        }

        res.json({ message: "All marked read" });
    } catch (err) {
        console.error("Mark all read error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;


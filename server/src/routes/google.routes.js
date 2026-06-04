import express from "express";
import { google } from "googleapis";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { getAuthenticatedClient } from "../services/google/tokenManager.js";

const router = express.Router();

// ─────────────────────────────────────────────
// CHECK GOOGLE CONNECTION STATUS
// ─────────────────────────────────────────────
router.get("/status", isAuthenticated, (req, res) => {
    const connected = !!(req.user.google_access_token && req.user.google_refresh_token);
    res.json({ connected });
});

// ─────────────────────────────────────────────
// LIST GOOGLE DRIVE FILES
// ─────────────────────────────────────────────
router.get("/drive/files", isAuthenticated, async (req, res) => {
    try {
        const oauth2Client = await getAuthenticatedClient(req.user);
        const drive = google.drive({ version: "v3", auth: oauth2Client });

        const { q, pageToken, folderId } = req.query;

        // Build query — exclude trashed
        let driveQuery = "trashed = false";
        
        if (q) {
            // If searching, just search everywhere
            driveQuery += ` and name contains '${q.replace(/'/g, "\\'")}'`;
        } else {
            // If not searching, scope to specific folder or root
            const parentId = folderId || 'root';
            driveQuery += ` and '${parentId}' in parents`;
        }

        const response = await drive.files.list({
            q: driveQuery,
            pageSize: 50, // Increase page size for better browsing
            pageToken: pageToken || undefined,
            fields: "nextPageToken, files(id, name, mimeType, size, iconLink, webViewLink, thumbnailLink, modifiedTime, parents)",
            orderBy: "folder, modifiedTime desc", // Folders first, then newest
        });

        res.json({
            files: response.data.files || [],
            nextPageToken: response.data.nextPageToken || null,
            currentFolderId: folderId || 'root'
        });
    } catch (err) {
        if (err.message === "GOOGLE_NOT_CONNECTED") {
            return res.status(403).json({ message: "Google account not connected", code: "NOT_CONNECTED" });
        }
        if (err.message === "GOOGLE_TOKEN_EXPIRED") {
            return res.status(401).json({ message: "Google session expired. Please reconnect.", code: "TOKEN_EXPIRED" });
        }
        console.error("[Google Drive] List files error:", err.message);
        console.error("[Google Drive] Full error:", JSON.stringify(err.response?.data || err.errors || {}, null, 2));
        res.status(500).json({ message: "Failed to fetch Drive files", detail: err.message });
    }
});

// ─────────────────────────────────────────────
// LIST GOOGLE CLASSROOM COURSES
// ─────────────────────────────────────────────
router.get("/classroom/courses", isAuthenticated, async (req, res) => {
    try {
        const oauth2Client = await getAuthenticatedClient(req.user);
        const classroom = google.classroom({ version: "v1", auth: oauth2Client });

        const response = await classroom.courses.list({
            pageSize: 30,
            courseStates: ["ACTIVE"],
        });

        const courses = (response.data.courses || []).map(c => ({
            id: c.id,
            name: c.name,
            section: c.section || "",
            description: c.descriptionHeading || c.description || "",
            enrollmentCode: c.enrollmentCode || ""
        }));

        res.json({ courses });
    } catch (err) {
        if (err.message === "GOOGLE_NOT_CONNECTED") {
            return res.status(403).json({ message: "Google account not connected", code: "NOT_CONNECTED" });
        }
        if (err.message === "GOOGLE_TOKEN_EXPIRED") {
            return res.status(401).json({ message: "Google session expired. Please reconnect.", code: "TOKEN_EXPIRED" });
        }
        console.error("[Google Classroom] List courses error:", err.message);
        res.status(500).json({ message: "Failed to fetch Classroom courses" });
    }
});

// ─────────────────────────────────────────────
// LIST COURSEWORK FOR A SPECIFIC COURSE
// ─────────────────────────────────────────────
router.get("/classroom/coursework", isAuthenticated, async (req, res) => {
    try {
        const { courseId } = req.query;
        if (!courseId) return res.status(400).json({ message: "courseId is required" });

        const oauth2Client = await getAuthenticatedClient(req.user);
        const classroom = google.classroom({ version: "v1", auth: oauth2Client });

        const response = await classroom.courses.courseWork.list({
            courseId,
            pageSize: 30,
            orderBy: "updateTime desc",
        });

        const coursework = (response.data.courseWork || []).map(cw => ({
            id: cw.id,
            title: cw.title,
            description: cw.description || "",
            dueDate: cw.dueDate ? `${cw.dueDate.year}-${String(cw.dueDate.month).padStart(2, '0')}-${String(cw.dueDate.day).padStart(2, '0')}` : null,
            dueTime: cw.dueTime ? `${String(cw.dueTime.hours || 0).padStart(2, '0')}:${String(cw.dueTime.minutes || 0).padStart(2, '0')}` : null,
            maxPoints: cw.maxPoints || 100,
            state: cw.state,
            materials: (cw.materials || []).map(m => {
                if (m.driveFile) {
                    return { type: "drive", title: m.driveFile.driveFile?.title || "Drive File", url: m.driveFile.driveFile?.alternateLink, fileId: m.driveFile.driveFile?.id };
                }
                if (m.link) {
                    return { type: "link", title: m.link.title || m.link.url, url: m.link.url };
                }
                if (m.youtubeVideo) {
                    return { type: "youtube", title: m.youtubeVideo.title || "YouTube Video", url: m.youtubeVideo.alternateLink };
                }
                return { type: "other", title: "Material" };
            }),
            createdAt: cw.creationTime
        }));

        res.json({ coursework });
    } catch (err) {
        if (err.message === "GOOGLE_NOT_CONNECTED") {
            return res.status(403).json({ message: "Google account not connected", code: "NOT_CONNECTED" });
        }
        if (err.message === "GOOGLE_TOKEN_EXPIRED") {
            return res.status(401).json({ message: "Google session expired. Please reconnect.", code: "TOKEN_EXPIRED" });
        }
        console.error("[Google Classroom] List coursework error:", err.message);
        res.status(500).json({ message: "Failed to fetch coursework" });
    }
});

export default router;

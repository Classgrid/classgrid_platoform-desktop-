import express from "express";
import {
    createPlaylist,
    getPlaylists,
    updatePlaylist,
    deletePlaylist,
    addVideo,
    getVideos,
    updateVideo,
    deleteVideo,
    getLibraryAnalytics,
    bulkAddVideos,
} from "../controllers/course-library.controller.js";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";
import { attachInstitutionProfile } from "../middleware/institution-profile.middleware.js";

const router = express.Router();

router.use(isAuthenticated, attachInstitutionProfile({ required: false }));

router.get("/institution-profile", attachInstitutionProfile(), (req, res) => {
    res.json({
        institution_profile: req.institutionProfile,
        library_profile: req.institutionProfile.libraryProfile,
        learner_record_profile: req.institutionProfile.learnerRecordProfile,
    });
});

// ═══════════════════════════════════════════════════════════════════
// 📚 MODULE 23: YouTube Course Library Routes
// ═══════════════════════════════════════════════════════════════════

// 🎬 PLAYLIST CRUD (Faculty/Admin)
router.post("/playlists", isAuthenticated, requireRole("faculty", "teacher", "org_admin"), createPlaylist);
router.get("/playlists/:classroomId", isAuthenticated, getPlaylists);
router.put("/playlists/:id", isAuthenticated, requireRole("faculty", "teacher", "org_admin"), updatePlaylist);
router.delete("/playlists/:id", isAuthenticated, requireRole("faculty", "teacher", "org_admin"), deletePlaylist);

// 📹 VIDEO CRUD (Faculty/Admin can add, students can view)
router.post("/videos", isAuthenticated, requireRole("faculty", "teacher", "org_admin"), addVideo);
router.post("/videos/bulk-add", isAuthenticated, requireRole("faculty", "teacher", "org_admin"), bulkAddVideos);
router.get("/videos/:classroomId", isAuthenticated, getVideos);
router.put("/videos/:id", isAuthenticated, requireRole("faculty", "teacher", "org_admin"), updateVideo);
router.delete("/videos/:id", isAuthenticated, requireRole("faculty", "teacher", "org_admin"), deleteVideo);

// 📊 ANALYTICS (Faculty/Admin)
router.get("/analytics/:classroomId", isAuthenticated, requireRole("faculty", "teacher", "org_admin"), getLibraryAnalytics);

export default router;

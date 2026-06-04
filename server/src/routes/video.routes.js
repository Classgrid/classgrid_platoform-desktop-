import express from "express";
import { 
    updateVideoProgress, 
    getClassroomVideoAnalytics, 
    getContinueWatching 
} from "../controllers/video.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

router.patch("/progress", isAuthenticated, updateVideoProgress);
router.get("/continue-watching", isAuthenticated, getContinueWatching);
router.get("/progress/:classroomId", isAuthenticated, getClassroomVideoAnalytics);

export default router;

import VideoProgress from "../models/VideoProgress.js";
import Classroom from "../models/Classroom.js";

/**
 * PATCH /api/video/progress
 * Updates the watch-time for a specific video and auto-marks completion if > 90%.
 */
export const updateVideoProgress = async (req, res) => {
    try {
        const { 
            classroomId, 
            materialId, 
            youtubeId, 
            currentTime, 
            duration 
        } = req.body;
        const userId = req.user._id;

        const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
        const isCompleted = percentage >= 90;

        const progress = await VideoProgress.findOneAndUpdate(
            { user: userId, materialId },
            {
                user: userId,
                classroom: classroomId,
                materialId,
                youtubeId,
                watchTimeSeconds: currentTime,
                totalDurationSeconds: duration,
                percentageWatched: Math.round(percentage),
                isCompleted: isCompleted, // Don't flip back to false if they re-watch
                lastAccessed: new Date()
            },
            { upsert: true, new: true }
        );

        // If completed, check if we need to trigger any classroom hooks (e.g., unlocking next chapter)
        if (isCompleted) {
            // Future: Emit 'MATERIAL_COMPLETED' event for real-time analytics
        }

        res.json({
            success: true,
            percentage: progress.percentageWatched,
            isCompleted: progress.isCompleted
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to sync video progress" });
    }
};

/**
 * GET /api/video/progress/:classroomId
 * Retrieves progress for all videos in a classroom for the current user.
 */
export const getClassroomVideoAnalytics = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const userId = req.user._id;

        const analytics = await VideoProgress.find({ 
            user: userId, 
            classroom: classroomId 
        }).lean();

        res.json({ success: true, analytics });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch video analytics" });
    }
};

/**
 * GET /api/video/continue-watching
 * Returns the latest 5 partially watched videos (percentage < 90).
 */
export const getContinueWatching = async (req, res) => {
    try {
        const userId = req.user._id;

        const continueList = await VideoProgress.find({
            user: userId,
            isCompleted: false,
            percentageWatched: { $gt: 0 }
        })
        .sort({ lastAccessed: -1 })
        .limit(5)
        .lean();

        res.json({ success: true, continueList });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch continue-watching list" });
    }
};

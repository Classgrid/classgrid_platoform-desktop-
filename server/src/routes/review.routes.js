import express from "express";
import Review from "../models/Review.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @route GET /api/reviews
 * @desc Get all public reviews
 * @access Public
 */
router.get("/", async (req, res) => {
    try {
        const reviews = await Review.find({ isPublic: true })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(reviews);
    } catch (err) {
        console.error("Fetch reviews error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @route POST /api/reviews
 * @desc Post a public review (guest or logged-in)
 * @access Public
 */
router.post("/", async (req, res) => {
    try {
        const { name, college, helped, rating, suggestion } = req.body;
        
        if (!name || !college || !helped || !rating) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const review = new Review({
            name,
            college,
            helped,
            rating,
            suggestion,
            isPublic: true // Reviews from the public page are public
        });

        await review.save();
        res.status(201).json({ message: "Review posted successfully", review });
    } catch (err) {
        console.error("Post review error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @route POST /api/reviews/feedback
 * @desc Post internal feedback from a module
 * @access Private
 */
router.post("/feedback", isAuthenticated, async (req, res) => {
    try {
        const { helped, rating, suggestion } = req.body;
        
        if (!helped || !rating) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const review = new Review({
            user: req.user._id,
            name: req.user.name,
            college: req.user.organization_name || "Personal Account",
            helped,
            rating,
            suggestion,
            isPublic: false // Feedback from module is private by default
        });

        await review.save();
        res.status(201).json({ message: "Feedback submitted successfully" });
    } catch (err) {
        console.error("Post feedback error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;

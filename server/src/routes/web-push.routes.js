import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import PushSubscription from "../models/PushSubscription.js";

const router = express.Router();

// Subscribe to web push notifications
router.post("/subscribe", isAuthenticated, async (req, res) => {
    try {
        const { endpoint, keys, userAgent } = req.body;
        if (!endpoint || !keys) {
            return res.status(400).json({ error: "Invalid subscription payload" });
        }

        let subscription = await PushSubscription.findOne({ endpoint });
        if (subscription) {
            if (subscription.userId.toString() !== req.user._id.toString()) {
                subscription.userId = req.user._id;
                await subscription.save();
            }
            return res.status(200).json({ message: "Subscription updated" });
        }

        subscription = new PushSubscription({
            userId: req.user._id,
            endpoint,
            keys,
            userAgent
        });
        await subscription.save();

        res.status(201).json({ message: "Subscribed to push notifications" });
    } catch (error) {
        console.error("Push subscription error:", error);
        res.status(500).json({ error: "Failed to subscribe" });
    }
});

router.post("/unsubscribe", isAuthenticated, async (req, res) => {
    try {
        const { endpoint } = req.body;
        await PushSubscription.deleteOne({ endpoint, userId: req.user._id });
        res.status(200).json({ message: "Unsubscribed from push notifications" });
    } catch (error) {
        res.status(500).json({ error: "Failed to unsubscribe" });
    }
});

router.get("/vapid-public-key", (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

export default router;

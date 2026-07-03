import webPush from "web-push";
import PushSubscription from "../models/PushSubscription.js";

// Initialize web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
        webPush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:admin@classgrid.in',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    } catch (err) {
        console.error("Failed to initialize VAPID details:", err.message);
        // Clear keys to gracefully degrade if invalid
        process.env.VAPID_PUBLIC_KEY = "";
        process.env.VAPID_PRIVATE_KEY = "";
    }
}

/**
 * Send a web push notification to all devices of a user
 * @param {string} userId - The MongoDB ObjectId of the user
 * @param {object} payload - The notification payload
 */
export const sendPushNotification = async (userId, payload) => {
    if (!process.env.VAPID_PUBLIC_KEY) {
        console.log("VAPID keys not configured, skipping push notification.");
        return;
    }

    try {
        const subscriptions = await PushSubscription.find({ userId });
        if (subscriptions.length === 0) return;

        const pushPayload = JSON.stringify(payload);

        const sendPromises = subscriptions.map(async (sub) => {
            try {
                await webPush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: sub.keys
                    },
                    pushPayload
                );
                // Update last used
                sub.lastUsed = Date.now();
                await sub.save();
            } catch (error) {
                // If subscription is expired/invalid (status 410 or 404), remove it
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                } else {
                    console.error("Error sending push notification:", error);
                }
            }
        });

        await Promise.all(sendPromises);
    } catch (error) {
        console.error("Failed to send push notifications for user", userId, error);
    }
};

/**
 * Send a web push notification to all devices of a specific role
 * @param {string} role - The role (e.g. "super_admin")
 * @param {object} payload - The notification payload
 */
export const sendPushToRole = async (role, payload) => {
    try {
        const User = (await import("../models/User.js")).default;
        const users = await User.find({ role }).select("_id").lean();
        const promises = users.map(u => sendPushNotification(u._id, payload));
        await Promise.all(promises);
    } catch (error) {
        console.error(`Failed to send push notifications to role ${role}`, error);
    }
};

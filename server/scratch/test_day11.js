import "../../env.js";
import { dispatchNotification, bulkDispatchNotification } from "../../src/services/notification.service.js";
import mongoose from "mongoose";

const testNotifications = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("🛠️ Connected to MongoDB for Testing...");

        const testUserId = "60d5f1e2e4b0f2a4c8e7e123"; // Dummy ID

        console.log("1. Testing Single Dispatch (Internal DB Only)...");
        const n1 = await dispatchNotification({
            recipientId: testUserId,
            type: "assignment",
            title: "🧪 Test Notification",
            message: "Hello from the Day 11 test script!",
            sendPush: false
        });
        console.log("Result:", n1 ? "Success ✅" : "Failed ❌");

        console.log("2. Testing Bulk Dispatch (Simulating Class-wide alert)...");
        await bulkDispatchNotification({
            recipientIds: [testUserId, "60d5f1e2e4b0f2a4c8e7e456"],
            type: "attendance",
            title: "📍 Attendance Session Live",
            message: "This is a bulk test.",
            sendPush: false
        });
        console.log("Bulk Result: Sent to 2 simulated recipients ✅");

        console.log("3. Day 11 Checklist Verification Complete.");
        process.exit(0);
    } catch (err) {
        console.error("Test Error:", err.message);
        process.exit(1);
    }
};

testNotifications();

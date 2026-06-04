import "../env.js";
import connectDB from "../config/db.js";
import AdmissionOTP from "../src/models/AdmissionOTP.js";
import mongoose from "mongoose";

async function testRateLimiting() {
    await connectDB();
    const orgId = new mongoose.Types.ObjectId();
    const en = "EN26123456787";

    console.log("--- Testing OTP Rate Limiting ---");

    // 1. Clear existing OTPs for the test EN
    await AdmissionOTP.deleteMany({ en_number: en });

    // 2. Insert 3 mock OTPs in last 5 minutes
    const now = new Date();
    await AdmissionOTP.insertMany([
        { organization_id: orgId, en_number: en, email: "test1@abc.com", otp: "111111", expires_at: now, purpose: "en_validation", createdAt: new Date(now - 5000) },
        { organization_id: orgId, en_number: en, email: "test2@abc.com", otp: "222222", expires_at: now, purpose: "en_validation", createdAt: new Date(now - 4000) },
        { organization_id: orgId, en_number: en, email: "test3@abc.com", otp: "333333", expires_at: now, purpose: "en_validation", createdAt: new Date(now - 3000) }
    ]);

    // 3. Check count logic (simulating controller logic)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const otpCount = await AdmissionOTP.countDocuments({
        en_number: en,
        createdAt: { $gte: oneHourAgo }
    });

    console.log(`Current OTP count for last hour: ${otpCount}`);
    
    if (otpCount >= 3) {
        console.log("✅ RATE LIMIT DETECTED (Logic Correct)");
    } else {
        console.log("❌ RATE LIMIT NOT DETECTED");
    }

    // Cleanup
    await AdmissionOTP.deleteMany({ en_number: en });
    process.exit(0);
}

testRateLimiting().catch(err => {
    console.error(err);
    process.exit(1);
});

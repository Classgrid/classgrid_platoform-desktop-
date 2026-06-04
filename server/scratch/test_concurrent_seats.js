import "../env.js";
import mongoose from "mongoose";
import SeatConfig from "../src/models/SeatConfig.js";
import seatMatrixService from "../src/services/admissions/seat-matrix.service.js";
import connectDB from "../config/db.js";

/**
 * Concurrent Seat Allocation Test
 * Simulates 10 simultaneous requests for a quota with only 3 seats.
 * Correct behavior: 3 should succeed, 7 should fail.
 */
async function testConcurrency() {
    await connectDB();
    console.log("🚀 Starting Concurrent Seat Test...");

    const orgId = new mongoose.Types.ObjectId("65ef8c91a7d6e80b2c123456");
    const hId = new mongoose.Types.ObjectId("65ef8c91a7d6e80b2c123789");
    const quotaName = "SPOT_ROUND";

    try {
        // 1. Setup Seat Config with 3 seats
        await SeatConfig.deleteMany({ organization_id: orgId });
        await SeatConfig.create({
            organization_id: orgId,
            hierarchy_id: hId,
            academic_year: "2024-25",
            total_intake: 3,
            quotas: [{ name: quotaName, capacity: 3, filled: 0 }]
        });
        console.log("✅ Seat Config initialized with 3 seats.");

        // 2. Launch 10 parallel requests
        console.log("⏱️ Launching 10 parallel allocation requests...");
        const requests = Array.from({ length: 10 }).map((_, i) => 
            seatMatrixService.allocateSeat(orgId, hId, quotaName)
                .then(res => ({ id: i, ...res }))
                .catch(err => ({ id: i, success: false, error: err.message }))
        );

        const results = await Promise.all(requests);

        // 3. Analyze Results
        const successes = results.filter(r => r.success);
        const failures = results.filter(r => !r.success);

        console.log("\n--- Results Summary ---");
        console.log(`✅ Successes: ${successes.length} (Expected: 3)`);
        console.log(`❌ Failures: ${failures.length} (Expected: 7)`);

        if (successes.length === 3 && failures.length === 7) {
            console.log("\n🎯 TEST PASSED: Atomic protection works!");
        } else {
            console.log("\n⚠️ TEST FAILED: Over-allocation occurred!");
        }

    } catch (error) {
        console.error("Test Error:", error);
    } finally {
        await mongoose.connection.close();
    }
}

testConcurrency();

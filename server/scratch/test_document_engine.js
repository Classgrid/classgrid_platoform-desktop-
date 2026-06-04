import "../env.js";
import mongoose from "mongoose";
import AdmissionApplication from "../src/models/AdmissionApplication.js";
import { checkTransitionGates, ADMISSION_STAGES } from "../src/services/admissions/admission-workflow.service.js";
import connectDB from "../config/db.js";

async function testDocumentWorkflow() {
    await connectDB();
    console.log("--- Document Engine Workflow Test ---");

    try {
        // 1. Create a dummy application for Engineering
        const testApp = new AdmissionApplication({
            organization_id: new mongoose.Types.ObjectId("65ef8c91a7d6e80b2c123456"), // Mock Org
            full_name: "Test Document Student",
            status: "applied",
            documents: [
                { name: "cet_allotment_letter", status: "pending", url: "path/to/doc" },
                { name: "12th_marksheet", status: "pending", url: "path/to/doc" }
            ]
        });

        // 2. Initial State: Applied
        // Test: Move to Fee Pending should fail (Invalid transition)
        const gate1 = checkTransitionGates(testApp, ADMISSION_STAGES.FEE_PENDING);
        console.log(`Test 1 (Gate - applied to fee_pending): ${!gate1.allowed ? "✅ PASSED (Blocked state jump)" : "❌ FAILED"}`);

        // 3. Move to Under Verification (Simulating first upload)
        testApp.status = ADMISSION_STAGES.UNDER_VERIFICATION;
        
        // 4. Simulate Admin Verification (Verify all docs)
        testApp.documents[0].status = "verified";
        testApp.documents[1].status = "verified";

        // 5. Move to Verified (Valid transition)
        const gate2 = checkTransitionGates(testApp, ADMISSION_STAGES.VERIFIED);
        console.log(`Test 2 (Gate - under_verification to verified): ${gate2.allowed ? "✅ PASSED" : "❌ FAILED"}`);
        if (gate2.allowed) testApp.status = ADMISSION_STAGES.VERIFIED;

        // 6. Move to Fee Pending (Should pass now)
        const gate3 = checkTransitionGates(testApp, ADMISSION_STAGES.FEE_PENDING);
        console.log(`Test 3 (Gate - verified to fee_pending): ${gate3.allowed ? "✅ PASSED" : "❌ FAILED"}`);
        if (!gate3.allowed) console.log(`Reason: ${gate3.reason}`);

        console.log("\n--- Logic Validation Complete ---");
    } catch (error) {
        console.error("Test Error:", error);
    } finally {
        await mongoose.connection.close();
    }
}

testDocumentWorkflow();

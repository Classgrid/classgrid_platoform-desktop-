import mongoose from "mongoose";
import dotenv from "dotenv";
import Organization from "../src/models/Organization.js";
import AdmissionApplication from "../src/models/AdmissionApplication.js";
import SeatConfig from "../src/models/SeatConfig.js";
import scholarshipService from "../src/services/admissions/scholarship.service.js";
import { promoteWaitlistInternal, ADMISSION_STAGES } from "../src/services/admissions/admission-workflow.service.js";
import seatMatrixService from "../src/services/admissions/seat-matrix.service.js";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

async function runTest() {
    console.log("Starting Verification Test...");
    try {
        if (!MONGODB_URI) throw new Error("MONGO_URI not found in environment.");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // CLEAN SLATE: Ensure the new index is correctly applied
        console.log("Cleaning up old test data and indices...");
        await AdmissionApplication.collection.drop().catch(() => {});
        await SeatConfig.collection.drop().catch(() => {});
        // Let Mongoose recreate indices
        await AdmissionApplication.init();
        await SeatConfig.init();
        console.log("✅ Collections reset and indices initialized.");

        const testOrgId = new mongoose.Types.ObjectId();
        const testHierarchyId = new mongoose.Types.ObjectId();
        const tfwsFeeStructureId = new mongoose.Types.ObjectId();
        const defaultFeeStructureId = new mongoose.Types.ObjectId();

        console.log("\n--- 1. Testing Scholarship Fee Mapping ---");
        // Create Org
        const org = new Organization({
            _id: testOrgId,
            name: "Test College",
            org_type: "engineering",
            structure_type: "engineering",
            address: "Pune",
            private_code: "TEST-" + Math.random().toString(36).substring(7),
            owner_id: new mongoose.Types.ObjectId(),
            admission_config: {
                fee_config: {
                    admission_fee_structure_id: defaultFeeStructureId,
                    dynamic_fee_mapping: [
                        {
                            attribute: "TFWS",
                            attribute_type: "seat_type",
                            fee_structure_id: tfwsFeeStructureId
                        }
                    ]
                }
            }
        });
        await org.save();

        const tfwsApp = new AdmissionApplication({
            organization_id: testOrgId,
            full_name: "TFWS Student",
            seat_type: "TFWS",
            status: "applied"
        });
        
        const resolvedFee = scholarshipService.calculateFeeStructure(tfwsApp, org);
        console.log(`Resolved: ${resolvedFee} | Expected: ${tfwsFeeStructureId}`);

        if (resolvedFee && resolvedFee.toString() === tfwsFeeStructureId.toString()) {
            console.log("✅ Scholarship Mapping Check: PASSED");
        } else {
            console.error("❌ Scholarship Mapping Check: FAILED");
        }

        console.log("\n--- 2. Testing Waitlist Promotion ---");
        // Test multiple null EN numbers (should pass now with partial index)
        const wl1 = new AdmissionApplication({
            organization_id: testOrgId,
            hierarchy_id: testHierarchyId,
            full_name: "Waitlist One",
            status: ADMISSION_STAGES.WAITLISTED,
            waitlist_number: 1,
            en_number: null // Critical check for index fix
        });
        const wl2 = new AdmissionApplication({
            organization_id: testOrgId,
            hierarchy_id: testHierarchyId,
            full_name: "Waitlist Two",
            status: ADMISSION_STAGES.WAITLISTED,
            waitlist_number: 2,
            en_number: null // Critical check for index fix
        });
        await wl1.save();
        await wl2.save();
        console.log("✅ Successfully saved two waitlisted applications with NULL en_number (Index Fix Verified)");

        const promoted = await promoteWaitlistInternal(testOrgId, testHierarchyId);
        console.log("Promoted student:", promoted?.full_name);

        if (promoted && promoted.full_name === "Waitlist One" && promoted.status === ADMISSION_STAGES.APPLIED) {
            console.log("✅ Waitlist Promotion Check: PASSED");
        } else {
            console.error("❌ Waitlist Promotion Check: FAILED");
        }

        console.log("\n--- 3. Testing Seat Release (Withdrawal) ---");
        const seatConfig = new SeatConfig({
            organization_id: testOrgId,
            hierarchy_id: testHierarchyId,
            academic_year: "2024-25",
            total_intake: 60,
            quotas: [
                { name: "CAP", capacity: 60, filled: 10 }
            ]
        });
        await seatConfig.save();

        console.log("Filled seats before release: 10");
        await seatMatrixService.releaseSeat(testOrgId, testHierarchyId, "CAP");
        
        const updatedConfig = await SeatConfig.findOne({ organization_id: testOrgId, hierarchy_id: testHierarchyId });
        const finalFilled = updatedConfig.quotas.find(q => q.name === "CAP").filled;
        console.log("Filled seats after release:", finalFilled);

        if (finalFilled === 9) {
            console.log("✅ Seat Release Check: PASSED");
        } else {
            console.error("❌ Seat Release Check: FAILED");
        }

        // Cleanup
        await Organization.deleteOne({ _id: testOrgId });
        await AdmissionApplication.deleteMany({ organization_id: testOrgId });
        await SeatConfig.deleteOne({ _id: seatConfig._id });
        console.log("\n--- Verification Complete ---");

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0); // Force exit to skip redis background noise
    }
}

runTest();

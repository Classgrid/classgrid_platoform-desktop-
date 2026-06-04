import "../env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { checkDuplicate } from "../src/services/admissions/duplicate-detector.service.js";
import AdmissionApplication from "../src/models/AdmissionApplication.js";

async function testDuplicateDetector() {
    await connectDB();
    const orgId = new mongoose.Types.ObjectId(); // Fake Org
    
    console.log("--- Testing Duplicate Detector ---");

    // 1. Create a dummy application
    const app = await AdmissionApplication.create({
        organization_id: orgId,
        full_name: "Test Student",
        phone: "+919876543210",
        dob: new Date("2000-01-01"),
        status: "draft"
    });
    console.log("Created test application ID:", app._id);

    // 2. Test Phone Duplicate
    const dup1 = await checkDuplicate(orgId, { phone: "+919876543210" });
    console.log("Phone Match Foundry?", !!dup1);

    // 3. Test Name + DOB Duplicate (Regex check)
    const dup2 = await checkDuplicate(orgId, { full_name: "test student ", dob: "2000-01-01" });
    console.log("Name + DOB Match Found?", !!dup2);

    // 4. Test Non-Duplicate
    const dup3 = await checkDuplicate(orgId, { phone: "+911111111111" });
    console.log("Non-duplicate Found?", !!dup3);

    // Cleanup
    await AdmissionApplication.deleteMany({ organization_id: orgId });
    console.log("Cleanup complete.");
    process.exit(0);
}

testDuplicateDetector().catch(err => {
    console.error(err);
    process.exit(1);
});

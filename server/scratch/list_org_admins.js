import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import Organization from "../src/models/Organization.js";
import User from "../src/models/User.js";

async function listOrgAdmins() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.\n");

        // Get all organizations
        const orgs = await Organization.find({}).select("name subdomain status custom_domain").lean();
        
        console.log("=".repeat(80));
        console.log("ALL ORGANIZATIONS AND THEIR ADMINS");
        console.log("=".repeat(80));

        for (const org of orgs) {
            const admins = await User.find({ 
                organization_id: org._id, 
                role: "org_admin" 
            }).select("name email role status").lean();

            const customDomain = org.custom_domain?.domain || "none";
            
            console.log(`\n📌 ORG: ${org.name}`);
            console.log(`   Subdomain: ${org.subdomain}.classgrid.in`);
            console.log(`   Custom Domain: ${customDomain}`);
            console.log(`   Status: ${org.status}`);
            console.log(`   Admins:`);
            
            if (admins.length === 0) {
                console.log(`     (no org_admin found)`);
            }
            for (const admin of admins) {
                console.log(`     👤 ${admin.name} | ${admin.email} | status: ${admin.status}`);
            }
        }

        // Now reset ONE admin from each org to a known password for testing
        const testPassword = "Test1234!";
        const hashedPassword = await bcrypt.hash(testPassword, 10);

        console.log("\n" + "=".repeat(80));
        console.log("RESETTING ALL ORG ADMIN PASSWORDS FOR TESTING");
        console.log("=".repeat(80));

        for (const org of orgs) {
            const admin = await User.findOne({ 
                organization_id: org._id, 
                role: "org_admin" 
            });
            
            if (admin) {
                admin.password = hashedPassword;
                admin.mustResetPassword = false;
                admin.isEmailVerified = true;
                await admin.save();
                console.log(`✅ ${org.subdomain}.classgrid.in → ${admin.email} → Password: ${testPassword}`);
            }
        }

        console.log("\n" + "=".repeat(80));
        console.log("SECURITY TEST INSTRUCTIONS:");
        console.log("=".repeat(80));
        console.log("Try logging in as Admin of ORG-A on ORG-B's subdomain.");
        console.log("Example: Go to bill.classgrid.in/admin/login and enter aps admin's email.");
        console.log("Expected result: BLOCKED with 'not registered to this institution's portal'");
        console.log("=".repeat(80));

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

listOrgAdmins();

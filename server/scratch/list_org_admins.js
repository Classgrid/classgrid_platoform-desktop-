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



        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

listOrgAdmins();

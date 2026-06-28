import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import Organization from "./src/models/Organization.js";
import User from "./src/models/User.js";

async function resetAdminPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const org = await Organization.findOne({ subdomain: "aec" });
        if (!org) {
            console.log("Organization 'aec' not found.");
            process.exit(1);
        }
        console.log(`Found Org: ${org.name} (ID: ${org._id})`);

        const admin = await User.findOne({ organization_id: org._id, role: "org_admin" });
        if (!admin) {
            console.log("No org_admin found for this organization.");
            process.exit(1);
        }

        console.log(`Found Admin User: ${admin.email}`);
        
        // Reset password to a known value
        const newPassword = "Password123!";
        admin.password = await bcrypt.hash(newPassword, 10);
        admin.mustResetPassword = false;
        admin.isEmailVerified = true;
        await admin.save();

        console.log("=========================================");
        console.log("ADMIN LOGIN DETAILS:");
        console.log(`Email: ${admin.email}`);
        console.log(`Password: ${newPassword}`);
        console.log(`Login URL: https://aec.classgrid.in/org/login`);
        console.log("=========================================");

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

resetAdminPassword();

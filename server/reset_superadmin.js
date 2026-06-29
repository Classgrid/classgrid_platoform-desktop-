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

        const admin = await User.findOne({ email: "nikhil.shinde@classgrid.in" });
        if (!admin) {
            console.log("Super Admin not found in the database.");
            process.exit(1);
        }

        console.log(`Found Super Admin User: ${admin.email}`);
        
        // Reset password to a known value
        const newPassword = "Password123!";
        admin.password = await bcrypt.hash(newPassword, 10);
        admin.mustResetPassword = false;
        admin.isEmailVerified = true;
        await admin.save();

        console.log("=========================================");
        console.log("SUPER ADMIN LOGIN DETAILS:");
        console.log(`Email: ${admin.email}`);
        console.log(`Password: ${newPassword}`);
        console.log(`Role: ${admin.role}`);
        console.log(`Status: ${admin.status}`);
        console.log("=========================================");

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

resetAdminPassword();

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import User from "../src/models/User.js";

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const newPassword = "TestPassword123!";
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const users = await User.find({ role: "org_admin" });
        
        if (users.length === 0) {
            console.log(`No org_admin users found.`);
        } else {
            for (const user of users) {
                user.password = hashedPassword;
                user.mustResetPassword = false;
                user.isEmailVerified = true;
                await user.save();
                console.log(`✅ Reset password for: ${user.email}`);
            }
            console.log(`\nSuccessfully reset password for all ${users.length} org_admin accounts to: ${newPassword}`);
        }
        
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

resetPassword();

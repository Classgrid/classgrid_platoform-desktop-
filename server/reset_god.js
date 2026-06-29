import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import User from "./src/models/User.js";

async function resetGodPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await User.findOne({ email: "nikhil.shinde@classgrid.in" });
        if (!admin) {
            console.log("Admin not found.");
            process.exit(1);
        }
        
        const newPassword = "Password123!";
        admin.password = await bcrypt.hash(newPassword, 10);
        admin.mustResetPassword = false;
        admin.isEmailVerified = true;
        await admin.save();

        console.log("Password reset successfully to: " + newPassword);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
resetGodPassword();

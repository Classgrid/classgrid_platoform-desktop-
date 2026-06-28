import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

// MUST load dotenv BEFORE importing brevo.service.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// Use dynamic import to ensure env vars are loaded first
async function run() {
    const { sendEmail } = await import("../src/services/brevo.service.js");
    const { getPasswordResetEmailHtml, getPasswordResetEmailPlainText } = await import("../src/services/email-templates.service.js");

    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("Sending email...");
        const resetLink = "https://classgrid.in/reset-password?token=fake_test_token_123";
        const email = "nikhilsubsun123@gmail.com";
        
        await sendEmail({
            to: email,
            subject: "🔑 Reset Your Password - Classgrid (TEST)",
            html: getPasswordResetEmailHtml(resetLink),
            text: getPasswordResetEmailPlainText(resetLink)
        });
        
        console.log(`Success! Sent test email to ${email}`);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

run();

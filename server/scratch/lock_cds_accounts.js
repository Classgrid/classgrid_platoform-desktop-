import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: "C:\\classgrid_marketting\\Classgrid_marketting\\.env.local" });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("MONGO_URI is not defined."); process.exit(1); }

const userSchema = new mongoose.Schema({
  name: String, email: String, password: { type: String, select: false },
  role: String, organization_id: mongoose.Schema.Types.ObjectId,
  isEmailVerified: Boolean, verification_status: String,
  mustResetPassword: Boolean, profile_completed: Boolean,
  emailVerificationToken: String, emailVerificationExpires: Date,
  otp: String, otpExpires: Date,
}, { strict: false });

const User = mongoose.model("User", userSchema);

async function lockAccounts() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  const realPassword = "nologin@5049";
  const hashedPassword = await bcrypt.hash(realPassword, 10);

  const cdsEmails = [
    "admin@cds.classgrid.in",
    "admission@cds.classgrid.in",
    "fees@cds.classgrid.in",
    "exam@cds.classgrid.in",
    "library@cds.classgrid.in",
    "attendance@cds.classgrid.in",
    "hr@cds.classgrid.in",
    "hostel@cds.classgrid.in",
    "faculty@cds.classgrid.in",
    "student@cds.classgrid.in",
  ];

  console.log("🔒 Updating passwords & disabling OTP for all CDS accounts...\n");

  for (const email of cdsEmails) {
    const result = await User.updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          isEmailVerified: true,
          verification_status: "verified",
          mustResetPassword: false,
          profile_completed: true,
        },
        $unset: {
          emailVerificationToken: "",
          emailVerificationExpires: "",
          otp: "",
          otpExpires: "",
          activationToken: "",
          activationTokenExpires: "",
        }
      }
    );

    if (result.modifiedCount === 1) {
      console.log(`   ✅ ${email} — password changed, OTP cleared, email verified`);
    } else {
      console.log(`   ⚠️  ${email} — not found or already up to date`);
    }
  }

  console.log("\n🎉 All 10 CDS accounts locked!");
  console.log("   Real password:     nologin@5049 (hidden from UI)");
  console.log("   Displayed (fake):  cdspass@123 (shown in preview)");
  console.log("   OTP:               DISABLED (all tokens cleared)");
  console.log("   Email verified:    YES (all accounts)");

  await mongoose.disconnect();
  console.log("\n✅ Disconnected.");
}

lockAccounts().catch(err => { console.error("❌ Error:", err); process.exit(1); });

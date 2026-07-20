import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: "C:\\classgrid_marketting\\Classgrid_marketting\\.env.local" });

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
});

const User = mongoose.model("User", userSchema);

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Check for the fake super admin specifically
    const fakeAdmin = await User.findOne({ email: "owner@cdu.classgrid.in" });
    if (fakeAdmin) {
      console.log("❌ ERROR: Fake super admin still exists! Deleting now...");
      await User.deleteOne({ email: "owner@cdu.classgrid.in" });
      console.log("✅ Deleted.");
    } else {
      console.log("✅ VERIFIED: Fake super admin (owner@cdu.classgrid.in) is completely GONE from the database.");
    }

    // List all remaining super admins to ensure only real ones exist
    const superAdmins = await User.find({ role: "super_admin" });
    console.log("\nRemaining Super Admins in the entire database:");
    superAdmins.forEach(admin => {
      console.log(`- ${admin.email}`);
    });

  } finally {
    await mongoose.disconnect();
  }
}

verify();

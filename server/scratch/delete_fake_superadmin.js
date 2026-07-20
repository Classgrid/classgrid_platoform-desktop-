import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from the marketing folder
dotenv.config({ path: "C:\\classgrid_marketting\\Classgrid_marketting\\.env.local" });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined.");
  process.exit(1);
}

const orgSchema = new mongoose.Schema({
  name: String,
  subdomain: String,
  owner_id: mongoose.Schema.Types.ObjectId,
});

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  organization_id: mongoose.Schema.Types.ObjectId,
});

const Organization = mongoose.model("Organization", orgSchema);
const User = mongoose.model("User", userSchema);

async function fix() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // 1. Find the real super admin
    const realSuperAdminEmail = process.env.SUPER_ADMIN_EMAIL || "support@classgrid.in";
    let realSuperAdmin = await User.findOne({ email: realSuperAdminEmail, role: "super_admin" });

    if (!realSuperAdmin) {
      console.log("Real super admin not found by email, falling back to finding the first super_admin...");
      realSuperAdmin = await User.findOne({ role: "super_admin", email: { $ne: "owner@cdu.classgrid.in" } });
    }

    if (!realSuperAdmin) {
       console.error("Could not find the real super admin. Aborting.");
       process.exit(1);
    }

    console.log(`Found real super admin: ${realSuperAdmin.email} (${realSuperAdmin._id})`);

    // 2. Reassign the CDU organization's owner to the real super admin
    const cduOrg = await Organization.findOne({ subdomain: "cdu" });
    if (cduOrg) {
        cduOrg.owner_id = realSuperAdmin._id;
        await cduOrg.save();
        console.log("CDU Organization owner_id reassigned to the real super admin.");
    } else {
        console.log("CDU Organization not found.");
    }

    // 3. Delete the fake super admin we created
    const deleteResult = await User.deleteOne({ email: "owner@cdu.classgrid.in" });
    if (deleteResult.deletedCount > 0) {
        console.log("✅ Successfully deleted the fake super admin (owner@cdu.classgrid.in).");
    } else {
        console.log("Fake super admin not found or already deleted.");
    }

  } catch (error) {
    console.error("Error during deletion:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

fix();

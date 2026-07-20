import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from the marketing folder
dotenv.config({ path: "C:\\classgrid_marketting\\Classgrid_marketting\\.env.local" });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined.");
  process.exit(1);
}

// Minimal schemas to bypass complex platform logic if we just need to insert
const orgSchema = new mongoose.Schema({
  name: String,
  subdomain: String,
  org_type: String,
  structure_type: String,
  address: String,
  owner_id: mongoose.Schema.Types.ObjectId,
  private_code: String,
  status: String,
  is_active: Boolean,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { type: String, select: false },
  role: String,
  organization_id: mongoose.Schema.Types.ObjectId,
  status: String,
  isEmailVerified: Boolean,
  verification_status: String,
});

const Organization = mongoose.model("Organization", orgSchema);
const User = mongoose.model("User", userSchema);

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    // Create a dummy owner user first if needed, or use the org_admin as owner.
    const passwordHash = await bcrypt.hash("demo123", 10);

    // Check if CDU already exists
    let org = await Organization.findOne({ subdomain: "cdu" });
    let owner;

    if (!org) {
      console.log("Creating CDU Organization...");
      owner = new User({
        name: "CDU Owner",
        email: "owner@cdu.classgrid.in",
        password: passwordHash,
        role: "super_admin",
        status: "active",
        isEmailVerified: true,
        verification_status: "verified",
      });
      await owner.save();

      org = new Organization({
        name: "Classgrid Demo University",
        subdomain: "cdu",
        org_type: "school",
        structure_type: "school_with_div",
        address: "Demo Campus, Virtual City",
        owner_id: owner._id,
        private_code: "CDU" + Date.now(),
        status: "active",
        is_active: true,
      });
      await org.save();
      console.log("CDU Organization created with ID:", org._id);

      // Assign org to owner
      owner.organization_id = org._id;
      await owner.save();
    } else {
      console.log("CDU Organization already exists with ID:", org._id);
    }

    const orgId = org._id;

    const rolesToCreate = [
      { name: "Student User", email: "student@cdu.classgrid.in", role: "student" },
      { name: "Faculty User", email: "faculty@cdu.classgrid.in", role: "faculty" },
      { name: "Org Admin", email: "admin@cdu.classgrid.in", role: "org_admin" },
      { name: "Admission Head", email: "admission@cdu.classgrid.in", role: "admission_head" },
      { name: "Fee Manager", email: "fees@cdu.classgrid.in", role: "fee_manager" },
      { name: "Exam Controller", email: "exam@cdu.classgrid.in", role: "exam_controller" },
      { name: "Library Manager", email: "library@cdu.classgrid.in", role: "library_manager" },
      { name: "Attendance Manager", email: "attendance@cdu.classgrid.in", role: "coordinator" },
      { name: "HR Manager", email: "hr@cdu.classgrid.in", role: "coordinator" }, // using coordinator as fallback
      { name: "Hostel Manager", email: "hostel@cdu.classgrid.in", role: "coordinator" },
    ];

    for (const r of rolesToCreate) {
      const existing = await User.findOne({ email: r.email });
      if (!existing) {
        console.log(`Creating user: ${r.email} (${r.role})`);
        const u = new User({
          name: r.name,
          email: r.email,
          password: passwordHash,
          role: r.role,
          organization_id: orgId,
          status: "active",
          isEmailVerified: true,
          verification_status: "verified",
        });
        await u.save();
      } else {
        console.log(`User ${r.email} already exists.`);
        // Update password just in case
        existing.password = passwordHash;
        existing.organization_id = orgId;
        await existing.save();
      }
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seed();

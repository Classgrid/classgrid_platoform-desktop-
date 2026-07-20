import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load env
dotenv.config({ path: "C:\\classgrid_marketting\\Classgrid_marketting\\.env.local" });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("MONGO_URI is not defined."); process.exit(1); }

// Minimal schemas
const orgSchema = new mongoose.Schema({
  name: String, subdomain: String, org_type: String, structure_type: String,
  address: String, owner_id: mongoose.Schema.Types.ObjectId, private_code: String,
  status: String, is_active: Boolean,
}, { strict: false });

const userSchema = new mongoose.Schema({
  name: String, email: String, password: { type: String, select: false },
  role: String, organization_id: mongoose.Schema.Types.ObjectId,
  status: String, isEmailVerified: Boolean, verification_status: String,
}, { strict: false });

const Organization = mongoose.model("Organization", orgSchema);
const User = mongoose.model("User", userSchema);

async function migrate() {
  console.log("🔄 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected!\n");

  // ──────────────────────────────────────────
  // STEP 1: DELETE OLD CDU
  // ──────────────────────────────────────────
  console.log("🗑️  STEP 1: Deleting old CDU records...");

  const oldOrg = await Organization.findOne({ subdomain: "cdu" });
  if (oldOrg) {
    const deletedUsers = await User.deleteMany({ organization_id: oldOrg._id });
    console.log(`   Deleted ${deletedUsers.deletedCount} CDU users`);
    await Organization.deleteOne({ _id: oldOrg._id });
    console.log("   Deleted CDU organization");
  } else {
    console.log("   No CDU org found (already clean)");
  }

  // Clean stray CDU emails
  const stray = await User.deleteMany({ email: /@cdu\.classgrid\.in$/i });
  if (stray.deletedCount > 0) console.log(`   Cleaned ${stray.deletedCount} stray CDU emails`);

  // Also check if CDS already exists and clean it
  const existingCds = await Organization.findOne({ subdomain: "cds" });
  if (existingCds) {
    const deletedCds = await User.deleteMany({ organization_id: existingCds._id });
    console.log(`   Deleted ${deletedCds.deletedCount} old CDS users`);
    await Organization.deleteOne({ _id: existingCds._id });
    console.log("   Deleted old CDS organization");
  }
  const strayCds = await User.deleteMany({ email: /@cds\.classgrid\.in$/i });
  if (strayCds.deletedCount > 0) console.log(`   Cleaned ${strayCds.deletedCount} stray CDS emails`);

  console.log("✅ Cleanup complete!\n");

  // ──────────────────────────────────────────
  // STEP 2: CREATE CDS (Classgrid Demo School)
  // ──────────────────────────────────────────
  console.log("🏫 STEP 2: Creating CDS (Classgrid Demo School)...");

  // Find real platform owner
  const platformOwner = await User.findOne({ email: "nikhil.shinde@classgrid.in" });
  if (!platformOwner) {
    console.error("❌ Platform owner (nikhil.shinde@classgrid.in) not found!");
    process.exit(1);
  }

  const cdsOrg = new Organization({
    name: "Classgrid Demo School",
    subdomain: "cds",
    org_type: "school",
    structure_type: "school_with_div",
    address: "Demo Campus, Virtual City",
    owner_id: platformOwner._id,
    private_code: "CDS" + Date.now(),
    status: "active",
    is_active: true,
  });
  await cdsOrg.save();
  console.log(`   ✅ Created org: "${cdsOrg.name}" (cds.classgrid.in)`);
  console.log(`   Org ID: ${cdsOrg._id}\n`);

  // ──────────────────────────────────────────
  // STEP 3: CREATE 10 ROLE ACCOUNTS
  // ──────────────────────────────────────────
  console.log("👥 STEP 3: Creating 10 demo accounts...\n");

  const passwordHash = await bcrypt.hash("demo123", 10);

  const accounts = [
    { name: "CDS Org Admin",          email: "admin@cds.classgrid.in",      role: "org_admin" },
    { name: "CDS Admission Head",     email: "admission@cds.classgrid.in",  role: "admission_head" },
    { name: "CDS Fee Manager",        email: "fees@cds.classgrid.in",       role: "fee_manager" },
    { name: "CDS Exam Controller",    email: "exam@cds.classgrid.in",       role: "exam_controller" },
    { name: "CDS Library Manager",    email: "library@cds.classgrid.in",    role: "library_manager" },
    { name: "CDS Attendance Manager", email: "attendance@cds.classgrid.in", role: "coordinator" },
    { name: "CDS HR Manager",         email: "hr@cds.classgrid.in",         role: "coordinator" },
    { name: "CDS Hostel Warden",      email: "hostel@cds.classgrid.in",     role: "coordinator" },
    { name: "CDS Demo Faculty",       email: "faculty@cds.classgrid.in",    role: "faculty" },
    { name: "CDS Demo Student",       email: "student@cds.classgrid.in",    role: "student" },
  ];

  for (const acc of accounts) {
    const u = new User({
      name: acc.name,
      email: acc.email,
      password: passwordHash,
      role: acc.role,
      organization_id: cdsOrg._id,
      status: "active",
      isEmailVerified: true,
      verification_status: "verified",
    });
    await u.save();
    console.log(`   ✅ ${acc.role.padEnd(22)} → ${acc.email}`);
  }

  console.log("\n🎉 Migration complete! CDU → CDS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   Org Name:    Classgrid Demo School");
  console.log("   Subdomain:   cds.classgrid.in");
  console.log("   Org Type:    school (school_with_div)");
  console.log("   Accounts:    10 roles created");
  console.log("   Password:    demo123 (all accounts)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  await mongoose.disconnect();
  console.log("\n✅ Disconnected from MongoDB.");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});

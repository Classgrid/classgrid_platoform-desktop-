/**
 * Seed default platform feature flags into MongoDB
 * Run with: node seed_feature_flags.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "server/.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/classgrid";

const FeatureFlagSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: String,
  isEnabled: { type: Boolean, default: true },
  module: { type: String, default: "core" },
  disabledForOrgs: [String],
  enabledForOrgs: [String],
  isPremium: { type: Boolean, default: false },
}, { timestamps: true });

const FeatureFlag = mongoose.model("FeatureFlag", FeatureFlagSchema);

const DEFAULT_FLAGS = [
  { key: "admissions",        name: "Admissions Module",       description: "CET/CAP admission workflow", module: "admissions",  isEnabled: true  },
  { key: "fees",              name: "Fees Management",          description: "Fee collection and receipts", module: "fees",       isEnabled: true  },
  { key: "attendance",        name: "Attendance Tracking",      description: "Student/staff attendance",   module: "attendance", isEnabled: true  },
  { key: "exams",             name: "Examination Module",       description: "Exam scheduling and results", module: "exams",     isEnabled: true  },
  { key: "library",           name: "Library Management",       description: "Book catalog and lending",   module: "library",   isEnabled: true  },
  { key: "hr_payroll",        name: "HR & Payroll",             description: "Staff payroll processing",   module: "hr",        isEnabled: true  },
  { key: "hostel",            name: "Hostel & Transport",       description: "Hostel room allocation",     module: "hostel",    isEnabled: true  },
  { key: "ai_features",       name: "AI Assistant",             description: "Classgrid AI features",     module: "ai",        isEnabled: true  },
  { key: "push_notifications",name: "Push Notifications",       description: "FCM mobile push",           module: "core",      isEnabled: true  },
  { key: "analytics",         name: "Analytics Dashboard",      description: "Usage analytics charts",    module: "analytics", isEnabled: true  },
  { key: "audit_reports",     name: "NAAC Audit Reports",       description: "NAAC/NBA compliance",       module: "audit",     isEnabled: true  },
  { key: "beta_features",     name: "Beta Features",            description: "Experimental features",     module: "core",      isEnabled: false },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB:", MONGO_URI.split("@").pop());

  let created = 0, skipped = 0;
  for (const flag of DEFAULT_FLAGS) {
    const exists = await FeatureFlag.findOne({ key: flag.key });
    if (exists) { skipped++; continue; }
    await FeatureFlag.create(flag);
    console.log(`  ✅ Created: ${flag.key}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped (already exist): ${skipped}`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error("❌ Seed failed:", err.message); process.exit(1); });

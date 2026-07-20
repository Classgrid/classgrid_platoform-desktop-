import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "C:\\classgrid_marketting\\Classgrid_marketting\\.env.local" });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("MONGO_URI is not defined."); process.exit(1); }

const orgSchema = new mongoose.Schema({
  name: String, subdomain: String, logo_url: String,
}, { strict: false });

const Organization = mongoose.model("Organization", orgSchema);

async function updateLogo() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const logoUrl = "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/CLASSGRID%20%20DEMO%20%20SCHOOL.png";

  const result = await Organization.updateOne(
    { subdomain: "cds" },
    { $set: { logo_url: logoUrl } }
  );

  if (result.modifiedCount === 1) {
    console.log("✅ CDS logo_url updated successfully!");
    console.log(`   URL: ${logoUrl}`);
  } else {
    console.log("⚠️  No CDS org found or already up to date");
  }

  await mongoose.disconnect();
  console.log("✅ Disconnected.");
}

updateLogo().catch(err => { console.error("❌ Error:", err); process.exit(1); });

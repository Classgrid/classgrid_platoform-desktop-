import dotenv from "dotenv";
dotenv.config({ path: "server/.env" });
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const users = db.collection("users");

const res = await users.updateMany(
  { role: "org_admin" },
  { $set: { isEmailVerified: true, verification_status: "verified", status: "active" } }
);

console.log(`✅ Updated ${res.modifiedCount} admin users to verified status`);

await mongoose.disconnect();
process.exit(0);

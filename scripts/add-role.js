import dotenv from "dotenv";
dotenv.config({ path: "server/.env" });
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const users = db.collection("users");

await users.updateOne(
  { email: "school_admin@classgrid.in" },
  { $set: { additional_roles: ["teacher"] } }
);

console.log("✅ Added teacher role to school admin");
await mongoose.disconnect();
process.exit(0);

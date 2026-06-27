import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await mongoose.connection.collection("users").findOne({ email: "eng_admin@classgrid.in" });
    console.log("ROLE IS:", user ? user.role : "NOT FOUND");
  } catch (error) {
    console.error("DB check failed:", error);
  } finally {
    mongoose.connection.close();
  }
}

checkDb();

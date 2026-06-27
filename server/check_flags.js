import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function checkFlags() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const org = await mongoose.connection.collection("organizations").findOne({ name: /Ambiguity Engineering College/i });
    console.log("FEATURE FLAGS:", org.feature_flags);
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}

checkFlags();

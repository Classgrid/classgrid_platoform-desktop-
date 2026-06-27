import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function enableFeature() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find Ambiguity Engineering College
    const org = await mongoose.connection.collection("organizations").findOne({ name: /Ambiguity Engineering College/i });
    if (!org) {
      console.log("Org not found");
      return;
    }
    
    // Enable the feature flag
    await mongoose.connection.collection("organizations").updateOne(
      { _id: org._id },
      { $set: { "feature_flags.custom_domain_module": true } }
    );
    
    console.log("Feature flag enabled successfully!");
  } catch (error) {
    console.error("DB update failed:", error);
  } finally {
    mongoose.connection.close();
  }
}

enableFeature();

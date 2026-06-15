import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve("../.env") });
import mongoose from "mongoose";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    await db.collection("users").updateMany(
        { email: { $in: ["eng_student@classgrid.in", "eng_faculty@classgrid.in"] } },
        { $set: { isEmailVerified: true } }
    );
    
    console.log("Verified emails for student and faculty");
    await mongoose.disconnect();
}
run();

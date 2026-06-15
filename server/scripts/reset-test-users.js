import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve("../.env") });
import mongoose from "mongoose";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    await db.collection("users").updateOne(
        { email: "eng_student@classgrid.in" },
        { $unset: { lockUntil: "", loginAttempts: "" } }
    );
    
    console.log("Unlocked student account");
    await mongoose.disconnect();
}
run();

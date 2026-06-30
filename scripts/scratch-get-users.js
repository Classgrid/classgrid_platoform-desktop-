import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve("./server/.env") });
import mongoose from "mongoose";
import bcrypt from "bcrypt";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const hashedPassword = await bcrypt.hash("Nikhil@5049", 10);

    const student = await db.collection("users").findOneAndUpdate(
        { email: "eng_student@classgrid.in" },
        { $set: { password: hashedPassword } },
        { returnDocument: "after" }
    );
    
    const faculty = await db.collection("users").findOneAndUpdate(
        { email: "eng_faculty@classgrid.in" },
        { $set: { password: hashedPassword } },
        { returnDocument: "after" }
    );
    
    console.log("Updated Student:", student ? student.email : "Not found");
    console.log("Updated Faculty:", faculty ? faculty.email : "Not found");
    
    await mongoose.disconnect();
}
run();

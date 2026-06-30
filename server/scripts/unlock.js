import connectDB from "./config/db.js";
import User from "./src/models/User.js";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
    await connectDB();
    await User.updateOne(
        { email: "eng_admission@classgrid.in" },
        { $set: { lockUntil: null, loginAttempts: 0 } }
    );
    console.log("Unlocked eng_admission!");
    process.exit(0);
};
run();

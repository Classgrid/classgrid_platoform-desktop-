import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function checkUser() {
    await mongoose.connect(process.env.MONGO_URI);
    const User = (await import("./src/models/User.js")).default;
    const users = await User.find({ role: { $in: ["super_admin", "co_super_admin"] } }).lean();
    console.log("Super Admins in DB:");
    users.forEach(user => {
        console.log(`- ${user.name} | ${user.email} | Role: ${user.role}`);
    });
    process.exit(0);
}

checkUser();

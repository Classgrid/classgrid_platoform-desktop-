import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function checkUser() {
    await mongoose.connect(process.env.MONGO_URI);
    const User = (await import("./src/models/User.js")).default;
    const user = await User.findOne({ email: "nikhil.shinde@classgrid.in" }).lean();
    console.log("User Data:", {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        profilePicture: user.profilePicture
    });
    process.exit(0);
}

checkUser();

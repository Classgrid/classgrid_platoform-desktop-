import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    additional_roles: [String]
});

const User = mongoose.model("User", userSchema);

const roleMapping = {
    "_student@": "student",
    "_faculty@": "faculty",
    "_admission@": "admission_head",
    "_fee@": "fee_manager",
    "_library@": "library_manager",
    "_exam@": "exam_controller",
    "_hod@": "hod",
    "_principal@": "principal"
};

async function fixRoles() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        const users = await User.find({ role: "super_admin" });
        console.log(`Found ${users.length} super_admins to check.`);
        
        let fixedCount = 0;

        for (const user of users) {
            // Skip the true super admin
            if (user.email === "nikhil.shinde@classgrid.in") continue;

            let newRole = null;
            
            for (const [key, role] of Object.entries(roleMapping)) {
                if (user.email.includes(key)) {
                    newRole = role;
                    break;
                }
            }

            if (newRole) {
                user.role = newRole;
                // Also update additional_roles to make sure it's consistent
                user.additional_roles = [newRole];
                await user.save();
                console.log(`✅ Fixed ${user.email} -> ${newRole}`);
                fixedCount++;
            } else {
                console.log(`⚠️ Unsure what role to give ${user.email}, leaving as super_admin.`);
            }
        }

        console.log(`Done! Fixed ${fixedCount} users.`);
        mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
        mongoose.disconnect();
    }
}

fixRoles();

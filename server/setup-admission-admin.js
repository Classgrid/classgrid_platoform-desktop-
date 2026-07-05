import mongoose from "mongoose";
import dotenv from "dotenv";

// Import directly to avoid path issues if possible, or define the schema inline for a quick script
dotenv.config();

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    additional_roles: [String],
    organization_id: mongoose.Schema.Types.ObjectId,
    status: String,
    verification_status: String
});

const User = mongoose.model("User", userSchema);

async function setupAdmissionAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        const email = "sunitasubhashsun123@gmail.com";
        const orgId = "6a2d452b1c952d43497101c8";
        const role = "admission_head"; // closest to "admission department admin"

        let user = await User.findOne({ email });

        if (user) {
            console.log(`User ${email} found. Updating...`);
            user.role = role;
            if (!user.additional_roles.includes(role)) {
                user.additional_roles.push(role);
            }
            user.organization_id = new mongoose.Types.ObjectId(orgId);
            user.status = "active";
            user.verification_status = "verified";
            await user.save();
            console.log("✅ User updated successfully as Admission Head.");
        } else {
            console.log(`User ${email} not found. Creating...`);
            user = new User({
                name: "Sunita Subhash",
                email: email,
                role: role,
                additional_roles: [role],
                organization_id: new mongoose.Types.ObjectId(orgId),
                status: "active",
                verification_status: "verified"
            });
            await user.save();
            console.log("✅ User created successfully as Admission Head.");
        }

        mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
        mongoose.disconnect();
    }
}

setupAdmissionAdmin();

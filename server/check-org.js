import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const orgSchema = new mongoose.Schema({
    name: String,
    type: String,
    org_type: String
}, { strict: false });

const Organization = mongoose.model("Organization", orgSchema, "organizations"); // guessing the collection name

async function checkOrg() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        const org = await Organization.findById("6a2d452b1c952d43497101c8").lean();
        
        if (org) {
            console.log("Organization found!");
            console.log("Name:", org.name);
            console.log("Type:", org.type || org.org_type || org.organizationType);
            console.log("Full Object:", JSON.stringify(org, null, 2));
        } else {
            console.log("Organization not found with that ID.");
        }

        mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
        mongoose.disconnect();
    }
}

checkOrg();

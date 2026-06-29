import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkOrg() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        
        // Find the org that was originally Ambiguity Engineering College / AEC
        // We can just list all orgs if there are few, or find by some known fields
        const orgs = await db.collection("organizations").find({}).toArray();
        
        console.log("=== ORGS WITH CUSTOM DOMAIN ===");
        const orgsWithCustomDomain = orgs.filter(org => org.custom_domain && org.custom_domain.domain);
        
        if (orgsWithCustomDomain.length === 0) {
             console.log("No organizations found with a custom domain.");
        } else {
             orgsWithCustomDomain.forEach(org => {
                console.log(`\nID: ${org._id}`);
                console.log(`Full Name: ${org.name}`);
                console.log(`Subdomain: ${org.subdomain ? org.subdomain + ".classgrid.in" : "N/A"}`);
                console.log(`Custom Domain: ${org.custom_domain.domain}`);
                console.log(`Status: ${org.custom_domain.status}`);
             });
        }
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkOrg();

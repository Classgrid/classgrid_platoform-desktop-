import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function listAllOrgsAndUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        
        // Get all organizations
        const orgs = await db.collection("organizations").find({}).toArray();
        
        console.log("╔══════════════════════════════════════════════════════════════╗");
        console.log("║              ALL ORGANIZATIONS IN DATABASE                   ║");
        console.log("╚══════════════════════════════════════════════════════════════╝");
        
        for (const org of orgs) {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`ORG NAME: ${org.name}`);
            console.log(`ORG ID: ${org._id}`);
            console.log(`SUBDOMAIN: ${org.subdomain || "N/A"}`);
            console.log(`CLASSGRID URL: ${org.subdomain ? org.subdomain + ".classgrid.in" : "N/A"}`);
            console.log(`CUSTOM DOMAIN: ${org.custom_domain?.domain || "NONE"}`);
            console.log(`CUSTOM DOMAIN STATUS: ${org.custom_domain?.status || "N/A"}`);
            console.log(`STATUS: ${org.status}`);
            console.log(`IS ACTIVE: ${org.is_active}`);
            console.log(`ORG TYPE: ${org.org_type}`);
            console.log(`OWNER EMAIL: ${org.ownerEmail || "N/A"}`);
            console.log(`OWNER NAME: ${org.ownerName || "N/A"}`);
        }
        
        // Get super admin users
        console.log(`\n\n╔══════════════════════════════════════════════════════════════╗`);
        console.log(`║              SUPER ADMIN USERS                               ║`);
        console.log(`╚══════════════════════════════════════════════════════════════╝`);
        
        const superAdmins = await db.collection("users").find({ role: "super_admin" }).toArray();
        for (const sa of superAdmins) {
            console.log(`\nNAME: ${sa.name}`);
            console.log(`EMAIL: ${sa.email}`);
            console.log(`ROLE: ${sa.role}`);
        }
        
        // Get org_admin users
        console.log(`\n\n╔══════════════════════════════════════════════════════════════╗`);
        console.log(`║              ORG ADMIN USERS                                 ║`);
        console.log(`╚══════════════════════════════════════════════════════════════╝`);
        
        const orgAdmins = await db.collection("users").find({ role: "org_admin" }).toArray();
        for (const oa of orgAdmins) {
            const org = orgs.find(o => o._id.toString() === (oa.organization_id?.toString() || ""));
            console.log(`\nNAME: ${oa.name}`);
            console.log(`EMAIL: ${oa.email}`);
            console.log(`ROLE: ${oa.role}`);
            console.log(`ORG: ${org?.name || "Unknown"}`);
            console.log(`SUBDOMAIN: ${org?.subdomain || "N/A"}`);
        }
        
        // Get some student/teacher users (limit 5 each)
        console.log(`\n\n╔══════════════════════════════════════════════════════════════╗`);
        console.log(`║              SAMPLE STUDENTS                                 ║`);
        console.log(`╚══════════════════════════════════════════════════════════════╝`);
        
        const students = await db.collection("users").find({ role: "student" }).limit(5).toArray();
        for (const s of students) {
            const org = orgs.find(o => o._id.toString() === (s.organization_id?.toString() || ""));
            console.log(`\nNAME: ${s.name}`);
            console.log(`EMAIL: ${s.email}`);
            console.log(`ORG: ${org?.name || "Unknown"}`);
        }
        
        console.log(`\n\n╔══════════════════════════════════════════════════════════════╗`);
        console.log(`║              SAMPLE TEACHERS                                 ║`);
        console.log(`╚══════════════════════════════════════════════════════════════╝`);
        
        const teachers = await db.collection("users").find({ role: "teacher" }).limit(5).toArray();
        for (const t of teachers) {
            const org = orgs.find(o => o._id.toString() === (t.organization_id?.toString() || ""));
            console.log(`\nNAME: ${t.name}`);
            console.log(`EMAIL: ${t.email}`);
            console.log(`ORG: ${org?.name || "Unknown"}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

listAllOrgsAndUsers();

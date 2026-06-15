/**
 * check-orgs-reset-passwords.js
 * 
 * 1. Lists all organizations grouped by org_type (school, engineering, junior_college, coaching)
 * 2. Resets all org_admin passwords to "Nikhil@5049"
 * 
 * Run: node server/scripts/check-orgs-reset-passwords.js
 */

import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env", import.meta.url).pathname.slice(1) });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGO_URI;
const NEW_PASSWORD = "Nikhil@5049";

if (!MONGO_URI) {
    console.error("❌ MONGO_URI not found in .env");
    process.exit(1);
}

async function run() {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected\n");

    const db = mongoose.connection.db;
    const orgsCollection = db.collection("organizations");
    const usersCollection = db.collection("users");

    // ─── STEP 1: List all organizations grouped by org_type ───
    const targetTypes = ["school", "junior_college", "engineering", "coaching"];

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("  📋 ALL ORGANIZATIONS BY TYPE");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const allOrgs = await orgsCollection.find({}).toArray();
    let totalOrgs = 0;

    for (const orgType of targetTypes) {
        const orgs = allOrgs.filter(o => o.org_type === orgType);
        console.log(`\n🏢 ${orgType.toUpperCase()} (${orgs.length} found)`);
        console.log("─".repeat(60));

        if (orgs.length === 0) {
            console.log("   (none)");
            continue;
        }

        for (const org of orgs) {
            totalOrgs++;
            console.log(`   📌 Name:        ${org.name}`);
            console.log(`      ID:          ${org._id}`);
            console.log(`      Subdomain:   ${org.subdomain || "(not set)"}`);
            console.log(`      Structure:   ${org.structure_type}`);
            console.log(`      Status:      ${org.status || "active"}`);
            console.log(`      Owner ID:    ${org.owner_id}`);
            console.log(`      URL:         ${org.subdomain ? `${org.subdomain}.classgrid.in` : "(no subdomain)"}`);
            console.log("");
        }
    }

    // Also list any orgs with OTHER types
    const otherOrgs = allOrgs.filter(o => !targetTypes.includes(o.org_type));
    if (otherOrgs.length > 0) {
        console.log(`\n🔸 OTHER TYPES (${otherOrgs.length} found)`);
        console.log("─".repeat(60));
        for (const org of otherOrgs) {
            totalOrgs++;
            console.log(`   📌 Name: ${org.name} | Type: ${org.org_type} | Subdomain: ${org.subdomain || "(not set)"}`);
        }
    }

    console.log(`\n📊 Total organizations: ${totalOrgs}`);

    // ─── STEP 2: Find all org_admin users and reset passwords ───
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("  🔐 RESETTING ORG_ADMIN PASSWORDS → Nikhil@5049");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const orgAdmins = await usersCollection.find({ role: "org_admin" }).toArray();
    console.log(`Found ${orgAdmins.length} org_admin user(s)\n`);

    if (orgAdmins.length === 0) {
        console.log("   ⚠️  No org_admin users found in the database.");
    } else {
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

        for (const admin of orgAdmins) {
            // Find the org name for this admin
            const adminOrg = allOrgs.find(o => String(o._id) === String(admin.organization_id));

            await usersCollection.updateOne(
                { _id: admin._id },
                {
                    $set: {
                        password: hashedPassword,
                        mustResetPassword: false,
                        loginAttempts: 0,
                        lockUntil: null,
                        passwordChangedAt: new Date(),
                    }
                }
            );

            console.log(`   ✅ ${admin.name} (${admin.email})`);
            console.log(`      Org:  ${adminOrg ? adminOrg.name : "(no org)"}`);
            console.log(`      Type: ${adminOrg ? adminOrg.org_type : "unknown"}`);
            console.log(`      Password → Nikhil@5049`);
            console.log("");
        }
    }

    // ─── STEP 3: Summary ───
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("  ✅ DONE — SUMMARY");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`   Organizations: ${totalOrgs}`);
    console.log(`   Org Admins:    ${orgAdmins.length} (password reset to Nikhil@5049)`);
    console.log("═══════════════════════════════════════════════════════════════\n");

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
}

run().catch(err => {
    console.error("💥 Script failed:", err);
    process.exit(1);
});

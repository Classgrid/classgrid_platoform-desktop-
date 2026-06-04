import mongoose from 'mongoose';

// Connection logic
const uri = "mongodb://classgrid-admin:pass123@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid";

const createTestOrg = async () => {
    try {
        await mongoose.connect(uri);
        const ObjectIds = mongoose.Types.ObjectId;
        const orgCollection = mongoose.connection.collection("organizations");

        // Insert new dummy organization
        const newOrg = {
            _id: new ObjectIds(),
            name: "testmyth",
            slug: "testmyth",
            structure_type: "school",
            subscription_plan: "enterprise",
            features: {
                admissions: true,
            },
            admission_config: {
                is_portal_open: true, // Need this open for applying!
                registration_fee: 500,
                form_builder_config: {   // Empty defaults so the strategy selector kicks in gracefully
                    field_toggles: [],
                    document_toggles: [],
                    custom_fields: []
                }
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await orgCollection.insertOne(newOrg);

        console.log("\n✅ BRAND NEW SCHOOL ORGANIZATION CREATED!");
        console.log(`Org Name: ${newOrg.name}`);
        console.log(`Structure: ${newOrg.structure_type}`);
        console.log(`Org ID: ${result.insertedId.toString()}`);
        console.log("\n👉 Copy this Org ID into your Postman {{orgId}} variable!");
        console.log("👉 Reminder: You might need to log into the frontend and assign yourself as 'org_admin' to this org to get a valid {{adminToken}} for it.");

    } catch (err) {
        console.error("Error creating org:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createTestOrg();

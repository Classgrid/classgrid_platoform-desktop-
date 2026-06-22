const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    const email = process.argv[2];
    const name = process.argv[3] || "Test Teacher";

    if (!email) {
        console.error("Please provide an email address. Example: node seed_test_user.cjs test@example.com 'John Doe'");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        
        // Create or update the test user as a Teacher
        await db.collection('users').updateOne(
            { email: email.toLowerCase() },
            { 
                $set: { 
                    name: name,
                    email: email.toLowerCase(),
                    role: "teacher",
                    status: "active",
                    organization_id: new mongoose.Types.ObjectId('6a2d45442e720333c3ab5bb7')
                } 
            },
            { upsert: true }
        );
        
        console.log(`✅ Successfully seeded ${name} (${email}) as a Teacher in the database!`);
    } catch (e) {
        console.error("Error seeding user:", e);
    } finally {
        process.exit(0);
    }
}
run();

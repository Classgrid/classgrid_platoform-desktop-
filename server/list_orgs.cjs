const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const orgs = await mongoose.connection.db.collection('organizations').find({}).toArray();
        console.log("Found Organizations:");
        orgs.forEach(o => console.log(`- ${o.name} (ID: ${o._id})`));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}
run();

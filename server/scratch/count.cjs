const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const orgsCount = await mongoose.connection.db.collection('organizations').countDocuments();
        
        // Count distinct divisions across all classrooms
        const divisions = await mongoose.connection.db.collection('classrooms').distinct('division');
        // Filter out null/empty divisions
        const validDivisions = divisions.filter(d => d);
        
        console.log(`\n📊 DATABASE STATS:`);
        console.log(`- Total Organizations: ${orgsCount}`);
        console.log(`- Total Unique Divisions: ${validDivisions.length}`);
        if (validDivisions.length > 0) {
            console.log(`- Division Names: ${validDivisions.join(', ')}`);
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}
run();

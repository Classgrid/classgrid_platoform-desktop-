import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import mongoose from "mongoose";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const orgs = await db.collection('organizations').find({}).toArray();
    for (const org of orgs) {
        const student = await db.collection('users').findOne({ organization_id: org._id, role: 'student' });
        console.log(`Type: ${org.institutionType || 'N/A'}, Org: ${org.name}, Email: ${student ? student.email : 'None found'}`);
    }
    
    await mongoose.disconnect();
}
run();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const orgs = await db.collection('organizations').find({}, { projection: { subdomain: 1, name: 1 } }).toArray();
  console.log(orgs);
  await mongoose.disconnect();
}
check().catch(console.error);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

const demoRequestSchema = new mongoose.Schema({
  institutionName: String,
  adminName: String,
  adminEmail: String,
  status: String,
  meetingStatus: String
}, { strict: false });

const DemoRequest = mongoose.models.DemoRequest || mongoose.model("DemoRequest", demoRequestSchema);

async function check() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    
    const count = await DemoRequest.countDocuments();
    console.log(`Total DemoRequests in DB: ${count}`);
    
    const leads = await DemoRequest.find().sort({ createdAt: -1 }).limit(10);
    console.log("Top 10 recent leads from DB:");
    console.log(JSON.stringify(leads, null, 2));
    
  } catch (error) {
    console.error("Error connecting or fetching:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

check();

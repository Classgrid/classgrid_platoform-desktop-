import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SupportTicket from './src/models/SupportTicket.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Remove gravatar from existing tickets using updateMany
    const result = await SupportTicket.updateMany(
        { "messages.avatar": { $regex: "gravatar" } },
        { $set: { "messages.$[elem].avatar": "" } },
        { arrayFilters: [ { "elem.avatar": { $regex: "gravatar" } } ], multi: true }
    );
    
    console.log(`✅ Fixed avatars for ${result.modifiedCount} tickets!`);

    process.exit(0);

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

run();

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection('supporttickets');

    // First check what's there
    const allTickets = await collection.find({}).toArray();
    console.log(`Found ${allTickets.length} total tickets\n`);

    for (const ticket of allTickets) {
      if (!ticket.messages?.length) continue;
      let needsUpdate = false;

      for (const msg of ticket.messages) {
        if (msg.role === 'user' && msg.avatar && msg.avatar !== '') {
          console.log(`STILL HAS AVATAR -> Ticket: "${ticket.subject}"`);
          console.log(`  Author: ${msg.author}, Avatar: ${msg.avatar.substring(0, 60)}...`);
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        // Directly update using native driver - no Mongoose validation
        const updatedMessages = ticket.messages.map(msg => {
          if (msg.role === 'user') {
            return { ...msg, avatar: '' };
          }
          return msg;
        });

        await collection.updateOne(
          { _id: ticket._id },
          { $set: { messages: updatedMessages } }
        );
        console.log(`  ✅ FIXED: "${ticket.subject}"\n`);
      }
    }

    console.log("✅ Done! All user avatars are now cleared.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

run();

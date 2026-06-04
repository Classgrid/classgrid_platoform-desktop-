import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SupportTicket from './src/models/SupportTicket.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find Nikhil's latest ticket
    const ticket = await SupportTicket.findOne({ submitterEmail: "nikhilsubsun321@gmail.com" }).sort({ createdAt: -1 });
    
    if (!ticket) {
      console.log("❌ Ticket not found");
      process.exit(1);
    }

    console.log(`✅ Found ticket: ${ticket.subject} (ID: ${ticket._id})`);

    const now = new Date();

    // Mark as resolved
    ticket.status = "resolved";
    ticket.resolvedAt = now;
    // Adding the resolution event
    ticket.events.push({
        type: 'resolved',
        label: 'Status changed to resolved',
        from: 'in_progress',
        to: 'resolved',
        actorName: "Komal Shinde",
        actorRole: "super_admin",
        createdAt: now
    });

    await ticket.save();
    console.log("✅ Ticket successfully marked as RESOLVED in the database!");

    process.exit(0);

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

run();

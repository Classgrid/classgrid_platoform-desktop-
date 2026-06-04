import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SupportTicket from './src/models/SupportTicket.js';
import { notifyTicketCreatorOfAdminReply } from './src/services/support-ticket-email.service.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Correct URL from user
    const adminName = "Komal Shinde";
    const avatar = "https://fiherpwzabiftbkwuqsb.supabase.co/storage/v1/object/public/notes-files/chat/WhatsApp%20Image%202026-05-22%20at%2011.39.33%20AM.jpeg";

    // Find Shivam's ticket
    const ticket = await SupportTicket.findOne({ submitterEmail: "shivamhande2604@gmail.com" }).sort({ createdAt: -1 });
    
    if (!ticket) {
      console.log("❌ Ticket not found");
      process.exit(1);
    }

    console.log(`✅ Found ticket: ${ticket.subject} (ID: ${ticket._id})`);

    const message = `
      <p>Hi Shivam,</p>
      <p>Thank you so much for your patience! I am happy to inform you that your issue has been completely resolved on our end.</p>
      <p>Please feel free to reach out again if you need any further assistance.</p>
      <p>Best regards,<br/>Komal</p>
    `;
    const now = new Date();

    // 1. Add reply to DB
    ticket.replies.push({
        authorName: adminName,
        authorRole: "super_admin",
        message: message,
        attachments: [],
        createdAt: now
    });

    ticket.messages.push({
        author: adminName,
        role: "admin",
        body: message,
        date: now,
        avatar: avatar, // REAL AVATAR URL
        attachments: []
    });

    ticket.events.push({
        type: 'adminReply',
        label: 'Admin replied & resolved',
        actorName: adminName,
        actorRole: 'super_admin',
        createdAt: now
    });

    ticket.lastComment = now;
    ticket.lastAdminReplyAt = now;
    ticket.status = "resolved"; // Marking it as resolved!

    await ticket.save();
    console.log("✅ Ticket updated in database and marked as RESOLVED!");

    // 2. Trigger Email
    console.log("⏳ Sending email notification...");
    const emailResult = await notifyTicketCreatorOfAdminReply({
        ticket,
        replyMessage: message,
        adminName
    });

    console.log("✅ Email queued successfully");
    console.log("🎉 All done!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

run();

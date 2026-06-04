import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection('supporttickets');

    const ticket = await collection.findOne({ subject: "Inquiry About Classgrid ERP – Modules, Pricing & Demo Request" });

    if (!ticket) {
      console.log("❌ Ticket not found");
      process.exit(1);
    }

    const cleanHTML = (html) => html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

    const updatedMessages = ticket.messages.map(msg => {
        if (msg.role === 'admin' && msg.body.includes('Hi Shivam')) {
            return { ...msg, body: cleanHTML(msg.body) };
        }
        return msg;
    });

    const updatedReplies = ticket.replies.map(reply => {
        if (reply.authorRole === 'super_admin' && reply.message.includes('Hi Shivam')) {
            return { ...reply, message: cleanHTML(reply.message) };
        }
        return reply;
    });

    await collection.updateOne(
        { _id: ticket._id },
        { $set: { messages: updatedMessages, replies: updatedReplies } }
    );

    console.log("✅ Fixed spacing issue in the database!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

run();

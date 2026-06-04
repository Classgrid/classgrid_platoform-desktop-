import mongoose from 'mongoose';

process.env.MONGODB_URI = "YOUR_MONGODB_URI";
process.env.BREVO_SMTP_HOST = "smtp-relay.brevo.com";
process.env.BREVO_SMTP_PORT = "587";
process.env.BREVO_SMTP_USER = "YOUR_BREVO_SMTP_USER";
process.env.BREVO_SMTP_PASS = "YOUR_BREVO_SMTP_PASS";
process.env.BREVO_SENDER_NAME = "Classgrid";
process.env.BREVO_SENDER_EMAIL = "support@classgrid.in";

import SupportTicket from 'file:///C:/Users/nikhi/OneDrive/Documents/Classgrid_platfrom/classgrid_platform/server/src/models/SupportTicket.js';
import { notifyTicketCreatorOfAdminReply } from 'file:///C:/Users/nikhi/OneDrive/Documents/Classgrid_platfrom/classgrid_platform/server/src/services/support-ticket-email.service.js';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const ticket = await SupportTicket.findById("6a1585cd60d74fa18630cf92");
    if (!ticket) {
        console.log("Ticket not found!");
        process.exit(1);
    }

    const now = new Date();
    const replyMessage = `<h2>Hello Sunita!</h2><p>This is a test reply from the Classgrid Support Team (simulated by AI).</p><ul><li>We received your message about WebSockets.</li><li>Your ticket has been updated successfully.</li></ul><p>Let us know if you have any other questions!</p>`;

    ticket.replies.push({
        authorName: "Nikhil",
        authorRole: "super_admin",
        message: replyMessage,
        attachments: [],
        createdAt: now
    });

    ticket.messages.push({
        author: "Nikhil",
        role: "admin",
        body: replyMessage,
        date: now
    });

    ticket.lastComment = now;
    ticket.status = "in_progress";

    await ticket.save();
    console.log("Ticket updated in DB.");

    try {
        const emailResult = await notifyTicketCreatorOfAdminReply({
            ticket,
            replyMessage
        });
        console.log("Email Notification Result:", emailResult);
    } catch (e) {
        console.error("Email failed:", e);
    }

    console.log("Done.");
    process.exit(0);
}

run();

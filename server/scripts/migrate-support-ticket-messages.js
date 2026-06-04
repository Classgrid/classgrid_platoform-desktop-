import "../env.js";
import mongoose from "mongoose";
import SupportTicket from "../src/models/SupportTicket.js";

const MONGO_URI = process.env.MONGO_URI;

function normalizeRole(authorRole) {
    const role = String(authorRole || "").toLowerCase();
    return role === "admin" || role === "super_admin" || role.includes("admin") ? "admin" : "user";
}

function buildMessages(ticket) {
    const messages = [];

    if (ticket.message) {
        messages.push({
            author: ticket.submitterName || "Classgrid User",
            role: "user",
            body: ticket.message,
            date: ticket.createdAt || new Date(),
            footer: ticket.submitterEmail ? `Email: ${ticket.submitterEmail}` : ""
        });
    }

    for (const reply of ticket.replies || []) {
        messages.push({
            author: reply.authorName || "Classgrid Support",
            role: normalizeRole(reply.authorRole),
            body: reply.message,
            date: reply.createdAt || new Date(),
            footer: ""
        });
    }

    return messages;
}

async function migrate() {
    if (!MONGO_URI) {
        throw new Error("MONGO_URI is required.");
    }

    await mongoose.connect(MONGO_URI);

    const tickets = await SupportTicket.find({
        $or: [
            { messages: { $exists: false } },
            { messages: { $size: 0 } },
            { lastComment: { $exists: false } }
        ]
    });

    let updated = 0;
    for (const ticket of tickets) {
        const messages = buildMessages(ticket);
        ticket.messages = messages;
        ticket.lastComment = messages[messages.length - 1]?.date || ticket.updatedAt || ticket.createdAt || new Date();
        await ticket.save();
        updated += 1;
    }

    console.log(`Migrated ${updated} support ticket(s).`);
}

migrate()
    .catch((error) => {
        console.error("Support ticket migration failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });

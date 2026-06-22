import mongoose from 'mongoose';
import SupportTicket from './server/src/models/SupportTicket.js';
import User from './server/src/models/User.js';
import { notifyTicketCreatorOfAdminReply } from './server/src/services/support-ticket-email.service.js';

async function adminReply() {
    try {
        await mongoose.connect('mongodb+srv://developer:fU2fXjU27j4GqL29@cluster0.p713p.mongodb.net/classgrid?retryWrites=true&w=majority');
        console.log('Connected to DB');

        const ticketId = '6a38c65a75e75d7f93118c64';
        const ticket = await SupportTicket.findById(ticketId);
        
        if (!ticket) {
            console.log('Ticket not found');
            process.exit(1);
        }

        const adminName = 'Nikhil Shinde';
        const adminEmail = 'nikhil.shinde@classgrid.in';
        const adminAvatar = 'https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/201196389.jpg';
        const replyMessage = '<p>Hello Teacher,</p><p>I have received your support ticket regarding the "Server Failed" error during attendance and the subsequent login issues on the ERP portal. I sincerely apologize for the disruption this has caused.</p><p>I want to assure you that I am personally investigating this right now. The attendance submission error triggered a temporary safeguard on your account, causing the lockout. I am actively working with our engineering team to lift the login lock and patch the server issue so you can submit your attendance smoothly.</p><p>I have officially assigned this ticket to myself and moved it to <strong>In Progress</strong>. You will receive another update from me very shortly once your access is restored.</p>';
        const now = new Date();

        // Admin assignment and status update
        ticket.status = 'in_progress';
        
        // Add to messages array
        ticket.messages.push({
            author: adminName,
            role: 'admin',
            body: replyMessage,
            date: now,
            avatar: adminAvatar,
            attachments: []
        });

        // Add to timeline events
        ticket.events.push({
            type: 'adminReply',
            label: 'Admin replied',
            actorName: adminName,
            actorRole: 'super_admin',
            createdAt: now
        });

        ticket.lastComment = now;
        ticket.lastAdminReplyAt = now;

        await ticket.save();
        console.log('Successfully saved Admin Reply to Database.');

        // Trigger the right email (Platform Ticket Email, NOT Classgrid Talk)
        console.log('Sending Platform Ticket Email...');
        const emailResult = await notifyTicketCreatorOfAdminReply({
            ticket,
            replyMessage,
            adminName,
            adminAvatar,
            adminEmail
        });

        console.log('Email Notification Result:', emailResult);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

adminReply();

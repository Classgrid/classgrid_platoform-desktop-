import mongoose from "mongoose";
import dotenv from "dotenv";
import { notifyTicketCreatorOfAdminReply } from "./src/services/support-ticket-email.service.js";

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const ticket = await db.collection("supporttickets").findOne({ _id: new mongoose.Types.ObjectId("6a37b28b8dfd0b161d6398f5") });
        
        if (!ticket) {
            console.log("Ticket not found");
            process.exit(1);
        }

        const replyMessage = "Hi Rahul, I apologize for the issues you are facing with the ERP system testing. I have reviewed the problems you mentioned regarding features not functioning and the errors in certain modules. Could you please share the screenshots so my engineering team can identify the root cause immediately? We are standing by to resolve this for you as our top priority.";
        
        const result = await notifyTicketCreatorOfAdminReply({
            ticket,
            replyMessage,
            adminName: "Nikhil Shinde",
            adminAvatar: "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/201196389.jpg",
            adminEmail: "nikhil.shinde@classgrid.in"
        });

        console.log("SUCCESS! Admin Reply Triggered!", result);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();

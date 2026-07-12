import dotenv from "dotenv";
dotenv.config();

// NOW import brevo service so process.env is populated
import { sendEmail } from "./src/services/brevo.service.js";
import { getDemoMeetingScheduledHtml, getDemoMeetingScheduledPlainText } from "./src/services/email-templates.service.js";


const data = {
  isReschedule: false,
  adminName: 'Nikhil',
  institutionName: 'Classgrid Internal Demo',
  scheduledAt: new Date(Date.now() + 86400000),
  meetingUrl: 'https://meet.google.com/abc-defg-hij',
  repName: 'Nikhil Shinde',
  repEmail: 'nikhil.shinde@classgrid.in',
  repAvatar: 'https://avatars.githubusercontent.com/u/108982352?v=4'
};

const html = getDemoMeetingScheduledHtml(data);
const text = getDemoMeetingScheduledPlainText(data);

async function run() {
  await sendEmail({
    to: "nikhilsubsun123@gmail.com",
    subject: "Demo Meeting Scheduled: Classgrid Internal Demo | Classgrid",
    html,
    text
  });
  console.log("Done");
  process.exit(0);
}
run().catch(e => console.error(e));

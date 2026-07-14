import nodemailer from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const TOTAL_ROUNDS = 1000;
const DELAY_MS = 1500;
const RECIPIENT = "sweetboysweet26@gmail.com";

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendFromBrevo(round) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.BREVO_SMTP_HOST,
            port: Number(process.env.BREVO_SMTP_PORT),
            secure: false,
            auth: {
                user: process.env.BREVO_SMTP_USER,
                pass: process.env.BREVO_SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: `"${process.env.BREVO_SENDER_NAME}" <${process.env.BREVO_SENDER_EMAIL}>`,
            to: RECIPIENT,
            subject: `Brevo Test ${round}/${TOTAL_ROUNDS} 🟢`,
            html: `
                <h3>Hello from Brevo!</h3>
                <p>This is test email ${round} of ${TOTAL_ROUNDS}.</p>
            `,
        });

        console.log(`✅ Brevo ${round}: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ Brevo ${round} failed:`, error.message);
    }
}

async function sendFromResend(round) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const result = await resend.emails.send({
            from: "Classgrid Notifications <notification@updates.classgrid.in>",
            to: RECIPIENT,
            subject: `Resend Test ${round}/${TOTAL_ROUNDS} 🟣`,
            html: `
                <h3>Hello from Resend!</h3>
                <p>This is test email ${round} of ${TOTAL_ROUNDS}.</p>
            `,
        });

        const resendId = result.id || result.data?.id;

        if (result.error) {
            throw new Error(result.error.message);
        }

        console.log(`✅ Resend ${round}: ${resendId}`);
    } catch (error) {
        console.error(`❌ Resend ${round} failed:`, error.message);
    }
}

async function runBoth() {
    console.log(`🚀 Sending ${TOTAL_ROUNDS} rounds...`);
    console.log(`This will send ${TOTAL_ROUNDS} Brevo emails and ${TOTAL_ROUNDS} Resend emails.`);

    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
        console.log(`\n📨 Round ${round}/${TOTAL_ROUNDS}`);

        await sendFromBrevo(round);
        await wait(DELAY_MS);

        await sendFromResend(round);
        await wait(DELAY_MS);
    }

    console.log("\n🏁 All email tests completed!");
}

runBoth().catch(error => {
    console.error("Fatal error:", error);
    process.exitCode = 1;
});

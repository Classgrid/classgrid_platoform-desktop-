import { sendEmail } from "./src/services/brevo.service.js";

async function run() {
    const email = "nikhilsubsun123@gmail.com";
    const name = "Nikhil";
    const role = "super_admin";
    const tempPassword = "test-password-123!";
    const loginUrl = "https://classgrid.in/superadmin/login";

    const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #0f172a;">Welcome to Classgrid, ${name}!</h2>
            <p>You have been invited to join the Classgrid Platform Team as a <strong>${role.replace("platform_", "").toUpperCase()}</strong>.</p>
            <p>Your temporary password is: <strong style="font-size: 18px; color: #0284c7;">${tempPassword}</strong></p>
            <p>Please log in and change your password immediately.</p>
            <div style="margin: 30px 0;">
                <a href="${loginUrl}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log in to Dashboard</a>
            </div>
            <p style="font-size: 12px; color: #64748b;">If you were not expecting this invitation, please ignore this email.</p>
        </div>
    `;

    try {
        console.log(`Sending test invite email to ${email}...`);
        await sendEmail({
            to: email,
            subject: "You've been invited to the Classgrid Platform Team",
            html: emailHtml,
            text: `Welcome to Classgrid! Your temporary password is: ${tempPassword}. Please log in at ${loginUrl} to reset it.`,
        });
        console.log("Email sent successfully!");
    } catch (err) {
        console.error("Failed to send email:", err);
    }
}

run();

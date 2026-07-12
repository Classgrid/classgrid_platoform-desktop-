import { sendEmail } from "./src/services/brevo.service.js";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const name = "Nikhil";
  const role = "platform_super_admin";
  const email = "nikhilsubsun321@gmail.com";
  const tempPassword = "test-password-123";
  const loginUrl = "https://classgrid.in/superadmin/login";

  const emailHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              body, html {
                margin: 0; padding: 0;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #0f0f0f;
                -webkit-font-smoothing: antialiased;
              }
            </style>
          </head>
          <body style="margin:0;padding:0;background-color:#0f0f0f;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background-color:#0f0f0f;width:100%;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color:#161616;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin:0 auto;max-width:600px;width:100%;">
                    <tr>
                      <td style="padding:30px;border-bottom:1px solid #2a2a2a;text-align:center;">
                        <img src="https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/android-chrome-512x512.png" alt="Classgrid" width="48" height="48" style="display:block;margin:0 auto;border-radius:6px;">
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:30px;color:#cccccc;font-size:15px;line-height:1.7;text-align:left;">
                        <h1 style="color:#ffffff;font-size:26px;margin-top:0;margin-bottom:16px;">Welcome to the Classgrid team, ${name}!</h1>
                        <p style="margin:0 0 16px 0; font-size:16px; color:#cccccc; line-height:1.6;">You have been officially invited to join the Classgrid Platform Team as a <strong>${role.replace("platform_", "").toUpperCase()}</strong>. We are absolutely thrilled to welcome you aboard.</p>
                        
                        <h3 style="color:#ffffff; margin:24px 0 16px 0; text-transform:uppercase; font-size:14px; letter-spacing:1px; border-bottom:1px solid #2a2a2a; padding-bottom:8px;">Your Platform Access Credentials</h3>
                        <p style="margin:0 0 20px 0; font-size:16px; color:#cccccc; line-height:1.6;">Below are your temporary credentials for the administrative dashboard.</p>
                        
                        <div style="background-color:#111111; border:1px solid #333333; border-radius:8px; padding:20px; margin-bottom:24px;">
                          <div style="font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:#9ca3af; margin-bottom:8px; font-weight:600;">Email Address</div>
                          <div style="font-family:monospace; font-size:18px; color:#ffffff; font-weight:bold; background-color:#000000; padding:12px 14px; border-radius:6px; border:1px solid #333333; margin-bottom:16px;">
                            <a href="mailto:${email.toLowerCase().trim()}" style="color:#ffffff !important; text-decoration:none;">${email.toLowerCase().trim()}</a>
                          </div>
                          
                          <div style="font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:#9ca3af; margin-bottom:8px; font-weight:600;">Temporary Password</div>
                          <div style="font-family:monospace; font-size:18px; color:#ffffff; font-weight:bold; background-color:#000000; padding:12px 14px; border-radius:6px; border:1px solid #333333;">${tempPassword}</div>
                        </div>
                        
                        <p style="margin:0 0 24px 0; font-size:16px; color:#cccccc;">Please log in and <strong style="color:#ffffff;">change your temporary password</strong> immediately to secure your account.</p>
                        
                        <div style="margin-top:24px;margin-bottom:32px;">
                          <a href="${loginUrl}" style="display:inline-block; background-color:#34d399 !important; color:#022c22 !important; padding:12px 28px; text-decoration:none !important; border-radius:6px; font-weight:bold; font-size:14px; margin-bottom:12px;">Login to Dashboard</a>
                        </div>
                        
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px;text-align:center;border-top:1px solid #2a2a2a;color:#7a7a7a;font-size:12px;">
                        © ${new Date().getFullYear()} Classgrid. All rights reserved.<br>
                        Secure access message. Do not forward this email.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;

  try {
    await sendEmail({
        to: email,
        subject: "You've been invited to the Classgrid Platform Team",
        html: emailHtml,
        text: `Welcome to Classgrid! Your temporary password is: ${tempPassword}.`,
    });
    console.log("Email sent successfully!");
  } catch(e) {
    console.error("Error:", e);
  }
}

test();

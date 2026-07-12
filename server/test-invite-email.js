import dotenv from "dotenv";

dotenv.config();

async function test() {
  const name = "Jane Doe";
  const role = "platform_super_admin";
  const email = "nikhilsubsun321@gmail.com";
  const tempPassword = "test-password-123";
  const loginUrl = "https://superadmin.classgrid.in/superadmin/login";
  const classgridEmail = "jane.doe@classgrid.in";
  const roleName = "Super Admin";

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
          .list {
            margin: 0 0 24px 0;
            padding-left: 20px;
          }
          .list li {
            color: #cccccc;
            font-size: 14px;
            margin-bottom: 12px;
            line-height: 1.6;
          }
          .list strong {
            color: #ffffff;
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background-color:#0f0f0f;">
        <!-- OUTER WRAPPER TO ENSURE DARK BACKGROUND IN GMAIL -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background-color:#0f0f0f;width:100%;">
          <tr>
            <td align="center">
              
              <!-- INNER CARD WRAPPER -->
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#161616;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin:0 auto;max-width:600px;width:100%;">
                
                <!-- HEADER (LOGO) -->
                <tr>
                  <td style="padding:30px;border-bottom:1px solid #2a2a2a;text-align:center;">
                    <img src="https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/android-chrome-512x512.png" alt="Classgrid" width="48" height="48" style="display:block;margin:0 auto;border-radius:6px;">
                  </td>
                </tr>
                
                <!-- BODY CONTENT -->
                <tr>
                  <td style="padding:30px;color:#cccccc;font-size:15px;line-height:1.7;text-align:left;">
                    <h1 style="color:#ffffff;font-size:26px;margin-top:0;margin-bottom:16px;">Welcome to the Classgrid team, ${name}!</h1>
                    <p style="margin:0 0 16px 0; font-size:16px; color:#cccccc; line-height:1.6;">We are absolutely thrilled to officially welcome you aboard. The entire team is excited to have you join us. As we continue to scale our platform and expand our community, your expertise and vision will be an invaluable asset to our mission.</p>
                    <p style="margin:0 0 32px 0; font-size:16px; color:#cccccc; line-height:1.6;">To help you hit the ground running, we've outlined your core focus areas and the initial resources you'll need below.</p>
                    
                    <h3 style="color:#ffffff; margin:0 0 16px 0; text-transform:uppercase; font-size:14px; letter-spacing:1px; border-bottom:1px solid #2a2a2a; padding-bottom:8px;">Your Responsibilities</h3>
                    <ul style="margin:0 0 32px 0; padding-left:20px; color:#cccccc; font-size:15px; line-height:1.6;">
                      <li style="margin-bottom:8px;"><strong>Marketing Site:</strong> Maintain the marketing codebase and send PRs. (<a href="https://github.com/Classgrid/Classgrid_marketting" style="color:#ffffff !important;text-decoration:underline;">Repository</a>)</li>
                      <li style="margin-bottom:8px;"><strong>Main Platform:</strong> Contribute directly to our core desktop platform. (<a href="https://github.com/Classgrid/classgrid_platoform-desktop-" style="color:#ffffff !important;text-decoration:underline;">Repository</a>)</li>
                      <li style="margin-bottom:8px;"><strong>Infrastructure:</strong> Help maintain our CI/CD GitHub Actions and monitor Vercel deployment stability.</li>
                      <li style="margin-bottom:8px;"><strong>Growth & Analytics:</strong> Oversee user tracking via <a href="https://posthog.com/" style="color:#ffffff !important;text-decoration:underline;">PostHog</a> and lead our Google SEO strategies.</li>
                      <li style="margin-bottom:8px;"><strong>Content Management:</strong> Manage new blog posts and changelog updates via our Sanity CMS.</li>
                    </ul>

                    <h3 style="color:#ffffff; margin:0 0 16px 0; text-transform:uppercase; font-size:14px; letter-spacing:1px; border-bottom:1px solid #2a2a2a; padding-bottom:8px;">Official Account Access</h3>
                    <p style="margin:0 0 20px 0; font-size:16px; color:#cccccc; line-height:1.6;">We use Zoho Mail exclusively for all official Classgrid email communications (we do not use Gmail). Below are your temporary credentials.</p>
                    
                    <!-- CREDENTIALS BOX -->
                    <div style="background-color:#111111; border:1px solid #333333; border-radius:8px; padding:20px; margin-bottom:24px;">
                      <div style="font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:#9ca3af; margin-bottom:8px; font-weight:600;">Email Address</div>
                      <div style="font-family:monospace; font-size:18px; color:#ffffff; font-weight:bold; background-color:#000000; padding:12px 14px; border-radius:6px; border:1px solid #333333; margin-bottom:16px;"><a href="mailto:${classgridEmail}" style="color:#ffffff !important; text-decoration:none;">${classgridEmail}</a></div>
                      
                      <div style="font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:#9ca3af; margin-bottom:8px; font-weight:600;">Temporary Password</div>
                      <div style="font-family:monospace; font-size:18px; color:#ffffff; font-weight:bold; background-color:#000000; padding:12px 14px; border-radius:6px; border:1px solid #333333;">${tempPassword}</div>
                    </div>
                    
                    <p style="margin:0 0 24px 0; font-size:16px; color:#cccccc;">Please log in and <strong style="color:#ffffff;">change your temporary password</strong> immediately.</p>
                    
                    <!-- Google Account Setup Instructions -->
                    <div style="background-color:#1a1a1a; border-left:3px solid #34d399; padding:16px 20px; border-radius:4px; margin-bottom:24px;">
                      <h4 style="color:#ffffff; margin:0 0 12px 0; font-size:16px;">Setup Your Chrome Profile & Workspace</h4>
                      <p style="margin:0 0 12px 0;color:#cccccc;font-size:15px;line-height:1.6;">To get the full workspace experience, please register this email as a Google Account. This allows you to create a dedicated Chrome Browser Profile, set your professional profile photo, use "Continue with Google" across our tools, and access Google Services (excluding Gmail). Follow these steps:</p>
                      <ol style="margin:0; padding-left:20px; color:#cccccc; font-size:15px; line-height:1.6;">
                        <li style="margin-bottom:6px;">Click <strong>Setup Google Account</strong> below and enter your name and details.</li>
                        <li style="margin-bottom:6px;">When prompted to create an email, click <strong>"Use your existing email"</strong> instead.</li>
                        <li style="margin-bottom:6px;">Enter your Zoho email address from above. Google will send an OTP to it, so <strong>you must log into your Zoho Mailbox first</strong> to retrieve the code and verify it.</li>
                      </ol>
                    </div>
                    
                    <!-- BUTTONS -->
                    <div style="margin-top:24px;margin-bottom:32px;">
                      <a href="https://mail.zoho.in/zm/#mail/views/unread" style="display:inline-block; background-color:#34d399 !important; color:#022c22 !important; padding:12px 28px; text-decoration:none !important; border-radius:6px; font-weight:bold; font-size:14px; margin-right:12px; margin-bottom:12px;">Login to Zoho Mailbox</a>
                      <a href="https://accounts.google.com/signup" style="display:inline-block; background-color:#2a2a2a !important; color:#ffffff !important; padding:12px 28px; text-decoration:none !important; border-radius:6px; font-weight:bold; font-size:14px; margin-bottom:12px; border:1px solid #333333;">Setup Google Account</a>
                    </div>

                    <!-- NEW: SUPER ADMIN DASHBOARD ACCESS -->
                    <h3 style="color:#ffffff; margin:0 0 16px 0; text-transform:uppercase; font-size:14px; letter-spacing:1px; border-bottom:1px solid #2a2a2a; padding-bottom:8px;">Classgrid Super Admin Dashboard</h3>
                    <p style="margin:0 0 16px 0; font-size:16px; color:#cccccc; line-height:1.6;">You have been assigned the role of <strong style="color:#ffffff;">${roleName}</strong> on the Classgrid Super Admin Dashboard. This gives you administrative access to manage the entire platform — organizations, users, billing, analytics, and more.</p>
                    <p style="margin:0 0 20px 0; font-size:16px; color:#cccccc; line-height:1.6;">Use the <strong style="color:#ffffff;">same Classgrid email and password</strong> shown above to log in.</p>
                    <div style="margin-bottom:32px;">
                      <a href="https://superadmin.classgrid.in/superadmin/login" style="display:inline-block; background-color:#ffffff !important; color:#000000 !important; padding:12px 28px; text-decoration:none !important; border-radius:6px; font-weight:bold; font-size:14px;">Login to Super Admin Dashboard</a>
                    </div>

                    <!-- NEW: SANITY STUDIO ACCESS -->
                    <h3 style="color:#ffffff; margin:0 0 16px 0; text-transform:uppercase; font-size:14px; letter-spacing:1px; border-bottom:1px solid #2a2a2a; padding-bottom:8px;">Classgrid Sanity Studio (CMS)</h3>
                    <p style="margin:0 0 16px 0; font-size:16px; color:#cccccc; line-height:1.6;">You also have access to our <strong style="color:#ffffff;">Sanity Studio</strong> — the content management system where you can manage blog posts, changelogs, case studies, help articles, and all website content. Use the <strong style="color:#ffffff;">same Classgrid email</strong> to sign in via Google.</p>
                    <div style="margin-bottom:32px;">
                      <a href="https://studio.classgrid.in/" style="display:inline-block; background-color:#2a2a2a !important; color:#ffffff !important; padding:12px 28px; text-decoration:none !important; border-radius:6px; font-weight:bold; font-size:14px; border:1px solid #333333;">Open Sanity Studio</a>
                    </div>
                    
                    <!-- SIGNATURE -->
                    <div style="margin-top:40px;">
                      <p style="margin:0; color:#ffffff; font-weight:bold; font-size:16px;">Nikhil Shinde</p>
                      <p style="margin:0; font-size:14px; color:#9ca3af;">Founder, Classgrid</p>
                    </div>
                  </td>
                </tr>
                
                <!-- FOOTER -->
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
    const { sendEmail } = await import("./src/services/brevo.service.js");
    await sendEmail({
        to: email,
        subject: "Welcome to the Classgrid team!",
        html: emailHtml,
        text: `Welcome to Classgrid! Your temporary password is: ${tempPassword}.`,
    });
    console.log("Email sent successfully!");
  } catch(e) {
    console.error("Error:", e);
  }
}

test();

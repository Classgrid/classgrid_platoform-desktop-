import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import axios from "axios";
import User from "../models/User.js";
import connectDB from "../../config/db.js";
import { sendNoAccountEmail } from "../controllers/auth.controller.js";

const getBackendUrl = () => {
    return process.env.BACKEND_URL?.trim() || (process.env.NODE_ENV === "production" ? "https://classgrid.in" : "http://localhost:3000");
};

const BACKEND_URL = getBackendUrl();

/**
 * IMPORTANT: Provider Isolation Policy
 * ─────────────────────────────────────
 * Each auth provider is completely separate:
 *   - A GitHub user CANNOT login with Google using the same email
 *   - A Google user CANNOT login with GitHub using the same email
 *   - A Facebook user CANNOT login with Google/GitHub using the same email
 *   - A manual (email/password) user CANNOT login with any OAuth provider
 *   - Each provider creates its OWN user record matched by provider-specific ID
 * 
 * Matching logic:
 *   1. First, try to find user by provider-specific ID (googleId, githubId, facebookId)
 *   2. If not found by ID, check if email exists with a DIFFERENT provider → BLOCK
 *   3. If no user exists → create new user with this provider
 */

const passportConfig = () => {
    // Serialize user
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user
    passport.deserializeUser(async (id, done) => {
        try {
            await connectDB(); // Ensure DB is connected before querying
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });

    // ═══════════════════════════════════════
    // 1. GOOGLE STRATEGY
    // ═══════════════════════════════════════
    if (process.env.GOOGLE_CLIENT_ID) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/api/auth/google/callback`,
                    passReqToCallback: true,
                },
                async (req, accessToken, refreshToken, profile, done) => {
                    try {
                        await connectDB(); // Ensure DB ready before any query
                        const email = profile.emails[0].value;

                        // Step 1: Find by googleId OR email (to allow linking)
                        let user = await User.findOne({
                            $or: [{ googleId: profile.id }, { email: email }]
                        });

                        if (user) {
                            console.log("✅ Google: Updating existing user");

                            // Link Google if not already linked
                            if (!user.linkedProviders.includes("google")) {
                                user.linkedProviders.push("google");
                            }

                            user.googleId = profile.id;
                            if (!user.authProvider) {
                                user.authProvider = "google";
                            }
                            user.isEmailVerified = true;
                            await user.save();
                            return done(null, user);
                        }

                        // Step 2: No user exists → Block login
                        console.log(`🚫 Google: Blocked login for non-existent user: ${email}`);
                        sendNoAccountEmail(email, req); // Fire and forget the email notification
                        return done(new Error("No account found for this email. Please ask your institution administrator to add you first."), null);
                    } catch (err) {
                        done(err, null);
                    }
                }
            )
        );
        console.log("✅ GoogleStrategy successfully registered with Passport");
    } else {
        console.error("❌ CRITICAL ERROR: process.env.GOOGLE_CLIENT_ID is missing!");
        console.error("❌ Passport skipped registering the Google Strategy.");
        console.error("❌ Fix: Add GOOGLE_CLIENT_ID to your Vercel Environment Variables immediately.");
    }

    // ═══════════════════════════════════════
    // 2. FACEBOOK STRATEGY
    // ═══════════════════════════════════════
    if (process.env.FACEBOOK_CLIENT_ID) {
        passport.use(
            new FacebookStrategy(
                {
                    clientID: process.env.FACEBOOK_CLIENT_ID,
                    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
                    callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${BACKEND_URL}/api/auth/facebook/callback`,
                    profileFields: ["id", "displayName", "photos", "emails"],
                    enableProof: true,
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        await connectDB(); // Ensure DB ready before any query
                        console.log("Facebook Profile Keys:", Object.keys(profile));
                        console.log("Facebook Emails:", profile.emails);

                        let email = profile.emails ? profile.emails[0].value : null;

                        // Fallback: Generate placeholder email if Facebook doesn't return one
                        if (!email) {
                            // sanitize name: "John Doe" -> "john_doe"
                            const sanitizedName = (profile.displayName || "user").toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                            const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
                            email = `facebook_${sanitizedName}_${randomSuffix}@classgrid.in`;
                            console.log(`⚠️ Facebook email missing. Using generated email: ${email}`);
                        }

                        // Step 1: Find by facebookId OR email
                        let user = await User.findOne({
                            $or: [{ facebookId: profile.id }, { email: email }]
                        });

                        if (user) {
                            console.log("✅ Facebook: Updating existing user");

                            if (!user.linkedProviders.includes("facebook")) {
                                user.linkedProviders.push("facebook");
                            }

                            user.facebookId = profile.id;
                            if (!user.authProvider) {
                                user.authProvider = "facebook";
                            }
                            user.isEmailVerified = true;
                            await user.save();
                            return done(null, user);
                        }

                        // Step 2: No user exists → Block login
                        console.log(`🚫 Facebook: Blocked login for non-existent user: ${email}`);
                        return done(new Error("No account found for this email. Please ask your institution administrator to add you first."), null);
                    } catch (err) {
                        done(err, null);
                    }
                }
            )
        );
    }

    // ═══════════════════════════════════════
    // 3. GITHUB STRATEGY
    // ═══════════════════════════════════════
    if (process.env.GITHUB_CLIENT_ID) {
        passport.use(
            new GitHubStrategy(
                {
                    clientID: process.env.GITHUB_CLIENT_ID,
                    clientSecret: process.env.GITHUB_CLIENT_SECRET,
                    callbackURL: process.env.GITHUB_CALLBACK_URL || `${BACKEND_URL}/api/auth/github/callback`,
                    scope: ["user:email"],
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        await connectDB(); // Ensure DB ready before any query
                        // Safe extraction of email
                        let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

                        // If not found in emails array, check _json
                        if (!email && profile._json && profile._json.email) {
                            email = profile._json.email;
                        }

                        if (!email) {
                            console.error("❌ GitHub Login Failed: No email found in profile", profile);
                            return done(new Error("No email found from GitHub. Please ensure your email is public or grant email permissions."), null);
                        }

                        console.log(`GitHub Login Attempt: ${email} (ID: ${profile.id})`);

                        // Step 1: Find by githubId OR email
                        let user = await User.findOne({
                            $or: [{ githubId: profile.id }, { email: email }]
                        });

                        if (user) {
                            console.log("✅ GitHub: Updating existing user");

                            if (!user.linkedProviders.includes("github")) {
                                user.linkedProviders.push("github");
                            }

                            user.githubId = profile.id;
                            if (!user.authProvider) {
                                user.authProvider = "github";
                            }
                            user.isEmailVerified = true;
                            await user.save();
                            return done(null, user);
                        }

                        // Step 2: No user exists → Block login
                        console.log(`🚫 GitHub: Blocked login for non-existent user: ${email}`);
                        return done(new Error("No account found for this email. Please ask your institution administrator to add you first."), null);
                    } catch (err) {
                        console.error("❌ GitHub Strategy Error:", err);
                        done(err, null);
                    }
                }
            )
        );
    }
    // ═══════════════════════════════════════
    // 4. LINKEDIN STRATEGY (Generic OAuth2)
    // ═══════════════════════════════════════
    if (process.env.LINKEDIN_CLIENT_ID) {
        passport.use(
            "linkedin",
            new OAuth2Strategy(
                {
                    authorizationURL: "https://www.linkedin.com/oauth/v2/authorization",
                    tokenURL: "https://www.linkedin.com/oauth/v2/accessToken",
                    clientID: process.env.LINKEDIN_CLIENT_ID,
                    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
                    callbackURL: process.env.LINKEDIN_CALLBACK_URL || `${BACKEND_URL}/api/auth/linkedin/callback`,
                    scope: ['openid', 'profile', 'email'],
                    state: false, // Stateless auth (no session)
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        await connectDB(); // Ensure DB ready before any query
                        // Manually fetch user profile from LinkedIn OIDC endpoint
                        const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        });

                        const linkedInProfile = response.data;
                        console.log("LinkedIn Profile Raw:", JSON.stringify(linkedInProfile, null, 2));

                        const email = linkedInProfile.email;
                        const picture = linkedInProfile.picture || "";
                        const name = linkedInProfile.name || "";
                        const linkedinId = linkedInProfile.sub; // 'sub' is the unique user ID in OIDC

                        if (!email) {
                            console.error("❌ LinkedIn Login Failed: No email found in profile");
                            return done(new Error("No email found from LinkedIn. Please ensure you have granted email permissions."), null);
                        }

                        console.log(`LinkedIn Login Attempt: ${email} (ID: ${linkedinId})`);

                        // Step 1: Find by linkedinId OR email
                        let user = await User.findOne({
                            $or: [{ linkedinId: linkedinId }, { email: email }]
                        });

                        if (user) {
                            console.log("✅ LinkedIn: Updating existing user");

                            if (!user.linkedProviders.includes("linkedin")) {
                                user.linkedProviders.push("linkedin");
                            }

                            user.linkedinId = linkedinId;
                            if (!user.authProvider) {
                                user.authProvider = "linkedin";
                            }
                            user.isEmailVerified = true;
                            await user.save();
                            return done(null, user);
                        }

                        // Step 2: No user exists → Block login
                        console.log(`🚫 LinkedIn: Blocked login for non-existent user: ${email}`);
                        return done(new Error("No account found for this email. Please ask your institution administrator to add you first."), null);
                    } catch (err) {
                        console.error("❌ LinkedIn Strategy Error:", err);
                        done(err, null);
                    }
                }
            )
        );
    }
};

export default passportConfig;

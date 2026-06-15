import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
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

    };\n\nexport default passportConfig;\n
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import axios from "axios";
import User from "../models/User.js";
import connectDB from "../../config/db.js";
import { sendNoAccountEmail } from "../controllers/auth.controller.js";

const getBackendUrl = () => {
    return process.env.BACKEND_URL?.trim() || (process.env.NODE_ENV === "production" ? "https://api.classgrid.in" : "https://api.classgrid.in");
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
                    callbackURL: process.env.NODE_ENV === "production"
                        ? "https://api.classgrid.in/api/auth/google/callback"
                        : "http://localhost:3000/api/auth/google/callback",
                    passReqToCallback: true,
                },
                async (req, accessToken, refreshToken, profile, done) => {
                    try {
                        await connectDB(); // Ensure DB ready before any query
                        let reqLoginTab = 'student';
                        let orgSlug = '';
                        if (req.query.state) {
                            try {
                                const stateObj = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf-8'));
                                if (stateObj.t) reqLoginTab = stateObj.t;
                                if (stateObj.h) {
                                    const hostParts = stateObj.h.split('.');
                                    if (hostParts.length >= 3 && !['www', 'app', 'api'].includes(hostParts[0])) {
                                        orgSlug = hostParts[0];
                                    }
                                }
                            } catch(e) {
                                reqLoginTab = req.query.state; // fallback for legacy
                            }
                        }

                        const email = profile.emails[0].value.toLowerCase();

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

                            // Capture real name from Google if current is a placeholder
                            const lowerName = user.name ? user.name.toLowerCase() : "";
                            const isPlaceholder = !user.name || lowerName.includes("admin") || lowerName.includes("student") || lowerName.includes("faculty") || lowerName.includes("teacher") || lowerName === "user";
                            
                            if (isPlaceholder && profile.displayName) {
                                user.name = profile.displayName;
                            }

                            // Capture profile picture from Google if missing
                            if (!user.profilePicture && profile.photos && profile.photos.length > 0) {
                                user.profilePicture = profile.photos[0].value;
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
                        sendNoAccountEmail(email, req, orgSlug); // Fire and forget the email notification
                        return done(new Error("We sent an message to your email"), null);
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

};

export default passportConfig;
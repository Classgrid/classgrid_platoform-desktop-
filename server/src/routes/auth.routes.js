/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import express from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
    loginLimiter,
    emailCheckLimiter,
    resetPasswordLimiter,
    otpSendLimiter
} from "../middleware/rateLimiter.js";
import {
    createOAuthState,
    oauthStateCookieOptions,
    OAUTH_STATE_COOKIE,
    verifyOAuthState,
} from "../services/oauth-state.service.js";

const router = express.Router();

const getFrontendUrl = () => {
    return process.env.FRONTEND_URL?.trim() || (process.env.NODE_ENV === "production" ? "https://classgrid.in" : "https://classgrid.in");
};

// Public System Config
router.get("/system-config", authController.getSystemConfig);

// Email-first login flow (secure check)
router.post("/check-email", emailCheckLimiter, authController.checkEmailForLogin);

// Manual Auth
router.post("/signup-init", authController.initiateSignup);
router.get("/verify-token/:token", authController.verifySignupToken);
router.post("/signup-complete", authController.completeSignup);
router.post("/check-admin-status", authController.checkAdminStatus);
router.post("/validate-activation-token", authController.validateActivationToken);
router.post("/activate-admin", authController.activateAdmin);
router.post("/finalize-onboarding", authController.finalizeOnboarding);
router.post("/resend-activation", authController.resendActivation);
router.post("/manual-activation-link", authController.resolveManualActivationLink);

router.post("/login", loginLimiter, authController.login);
router.post("/request-login-otp", loginLimiter, authController.requestLoginOtp);
router.post("/resend-device-otp", otpSendLimiter, authController.resendDeviceOtp);
router.post("/verify-device", authController.verifyDeviceOtp);

router.post("/onboarding-send-otp", otpSendLimiter, authController.sendOnboardingOtp);
router.post("/onboarding-verify-otp", authController.verifyOnboardingOtp);
router.post("/check-username", authController.checkUsername);

router.post("/setup-org-admin", authController.setupOrgAdmin); // kept for backward compat
router.post("/logout", authController.logout);

router.get("/me", isAuthenticated, authController.getCurrentUser);

router.post("/forgot-password", resetPasswordLimiter, authController.forgotPassword);
router.get("/verify-reset-token/:token", authController.verifyResetToken);
router.post("/reset-password", resetPasswordLimiter, authController.resetPassword);
router.post("/faculty-activate", resetPasswordLimiter, authController.facultyActivate);
router.post("/force-reset-password", isAuthenticated, authController.forceResetPassword);
router.post("/change-password", isAuthenticated, authController.changePassword);
router.post("/delete-account", isAuthenticated, authController.deleteAccount);

// Google OAuth
router.get(
    "/google",
    async (req, res, next) => {
        const loginTab = req.query.loginTab || req.query.role || 'student';
        const host = req.query.host || '';
        try {
            const { state, nonce } = await createOAuthState({ loginTab, host });
            res.cookie(OAUTH_STATE_COOKIE, nonce, oauthStateCookieOptions());
            passport.authenticate("google", {
                scope: ["profile", "email"],
                state,
                prompt: 'select_account consent'
            })(req, res, next);
        } catch (error) {
            return res.status(400).json({ message: error.message || "Invalid login portal." });
        }
    }
);
router.get(
    "/google/callback",
    async (req, res, next) => {
        const stateRaw = req.query.state || null;
        const defaultFrontendUrl = process.env.FRONTEND_URL?.trim() || (process.env.NODE_ENV === "production" ? "https://classgrid.in" : "https://classgrid.in");
        let oauthState;
        try {
            oauthState = await verifyOAuthState(stateRaw, req.cookies?.[OAUTH_STATE_COOKIE]);
        } catch (error) {
            res.clearCookie(OAUTH_STATE_COOKIE, oauthStateCookieOptions({ clear: true }));
            return res.redirect(`${defaultFrontendUrl}/login?error=invalid_oauth_state`);
        }
        res.clearCookie(OAUTH_STATE_COOKIE, oauthStateCookieOptions({ clear: true }));
        req.oauthState = oauthState;

        const { host, loginTab } = oauthState;
        const scheme = process.env.NODE_ENV === "production" ? "https://" : "http://";
        const TARGET_URL = host ? `${scheme}${host}` : defaultFrontendUrl;
        const errorPath = loginTab === 'super_admin' ? '/superadmin/login' : '/login';

        passport.authenticate("google", { session: false }, (err, user) => {
            if (err) {
                console.error("Google OAuth Error Trace:", err.stack || err);
                return res.redirect(`${TARGET_URL}${errorPath}?error=google_blocked&message=${encodeURIComponent(err.message)}`);
            }
            if (!user) {
                return res.redirect(`${TARGET_URL}${errorPath}?error=AuthFailed`);
            }
            req.user = user;
            return authController.oauthCallback(req, res);
        })(req, res, next);
    }
);

export default router;

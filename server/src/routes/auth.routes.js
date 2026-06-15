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

const router = express.Router();

const getFrontendUrl = () => {
    return process.env.FRONTEND_URL?.trim() || (process.env.NODE_ENV === "production" ? "https://classgrid.in" : "http://localhost:3000");
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
router.post("/resend-activation", authController.resendActivation);
router.post("/manual-activation-link", authController.resolveManualActivationLink);

router.post("/login", loginLimiter, authController.login);
router.post("/request-login-otp", loginLimiter, authController.requestLoginOtp);
router.post("/resend-device-otp", otpSendLimiter, authController.resendDeviceOtp);
router.post("/verify-device", authController.verifyDeviceOtp);
router.post("/setup-org-admin", authController.setupOrgAdmin); // kept for backward compat
router.post("/logout", authController.logout);

router.get("/me", isAuthenticated, authController.getCurrentUser);

router.post("/forgot-password", resetPasswordLimiter, authController.forgotPassword);
router.post("/reset-password", resetPasswordLimiter, authController.resetPassword);
router.post("/faculty-activate", resetPasswordLimiter, authController.facultyActivate);
router.post("/force-reset-password", isAuthenticated, authController.forceResetPassword);

// Google OAuth
router.get(
    "/google",
    (req, res, next) => {
        const loginTab = req.query.loginTab || req.query.role || 'student';
        passport.authenticate("google", {
            scope: ["profile", "email"],
            state: loginTab, prompt: 'select_account consent' // survives the round-trip through Google OAuth
        })(req, res, next);
    }
);
router.get(
    "/google/callback",
    (req, res, next) => {
        const FRONTEND_URL = getFrontendUrl();
        passport.authenticate("google", { session: false }, (err, user) => {
            if (err) {
                console.error("Google OAuth Error:", err.message);
                return res.redirect(`${FRONTEND_URL}/login?error=google_blocked&message=${encodeURIComponent(err.message)}`);
            }
            if (!user) {
                return res.redirect(`${FRONTEND_URL}/login?error=AuthFailed`);
            }
            req.user = user;
            next();
        })(req, res, next);
    },
    authController.oauthCallback
);

export default router;

import express from "express";
import { markBiometricAttendance } from "../controllers/external.controller.js";
import { verifyBiometricDevice } from "../middleware/biometricAuth.middleware.js";
import { rateLimit } from "express-rate-limit";

const router = express.Router();

// Allow moderate limit for hardware devices (turnstile scanners send bulk requests sometimes)
const hardwareRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // limit each IP to 300 requests per windowMs
    message: { success: false, message: "Too many biometric pushes from this IP" },
});

// Biometric attendance webhook
router.post(
    "/faculty/attendance",
    hardwareRateLimiter,
    verifyBiometricDevice,
    markBiometricAttendance
);

export default router;

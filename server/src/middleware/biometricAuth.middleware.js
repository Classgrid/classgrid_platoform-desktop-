import Organization from "../models/Organization.js";
import crypto from "crypto";

export const verifyBiometricDevice = async (req, res, next) => {
    try {
        const apiKey = req.headers["x-api-key"];
        const signature = req.headers["x-signature"]; // Optional: HMAC signature of payload
        const requestIp = req.ip || req.connection.remoteAddress;

        if (!apiKey) {
            return res.status(401).json({ success: false, message: "Missing x-api-key header" });
        }

        // Find organization with this API key
        const org = await Organization.findOne({ "hr_config.biometric_api_key": apiKey });

        if (!org) {
            return res.status(401).json({ success: false, message: "Invalid API Key" });
        }

        // Check if IP is whitelisted (if whitelists are configured)
        const whitelistedIps = org.hr_config?.whitelisted_ips || [];
        if (whitelistedIps.length > 0 && !whitelistedIps.includes(requestIp)) {
            // Note: In local development or misconfigured proxies, IP might not match perfectly.
            // You might want to bypass IP check in non-production.
            if (process.env.NODE_ENV === "production") {
                return res.status(403).json({ success: false, message: `IP ${requestIp} not whitelisted` });
            }
        }

        // Check signature if secret hash is provided
        const secret = org.hr_config?.biometric_secret_hash;
        if (secret && signature) {
            const payloadString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            const expectedSignature = crypto
                .createHmac("sha256", secret)
                .update(payloadString)
                .digest("hex");

            if (expectedSignature !== signature) {
                return res.status(401).json({ success: false, message: "Invalid Signature" });
            }
        }

        // Attach organization to request
        req.organization = org;
        next();
    } catch (error) {
        console.error("Biometric Auth Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

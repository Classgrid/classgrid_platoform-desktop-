import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

/**
 * Middleware to verify admission candidate session tokens.
 * Injected for routes like /save-draft and /submit.
 */
export const isAdmissionCandidate = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ error: "Admission session token required." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== "admission_candidate") {
            return res.status(403).json({ error: "Invalid session type." });
        }

        // Attach payload to request
        req.admission_payload = decoded;
        next();
    } catch (err) {
        console.error("Admission Auth Error:", err.message);
        return res.status(401).json({ error: "Session expired or invalid. Please login again." });
    }
};

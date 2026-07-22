const VERIFY_ENDPOINT = "https://www.google.com/recaptcha/api/siteverify";

export class RecaptchaVerificationError extends Error {
    constructor(message, { status = 403, code = "RECAPTCHA_FAILED" } = {}) {
        super(message);
        this.name = "RecaptchaVerificationError";
        this.status = status;
        this.code = code;
    }
}

/** Verify a reCAPTCHA v3 token and enforce its action and score. */
export async function verifyRecaptchaToken({ token, expectedAction = "login", remoteIp } = {}) {
    if (process.env.RECAPTCHA_ENABLED === "false") {
        return { success: true, skipped: "explicitly_disabled" };
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY || process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new RecaptchaVerificationError(
                "Sign-in protection is temporarily unavailable. Please try again later.",
                { status: 503, code: "RECAPTCHA_NOT_CONFIGURED" }
            );
        }
        return { success: true, skipped: "development_without_secret" };
    }

    if (!token || typeof token !== "string") {
        throw new RecaptchaVerificationError("Complete the security check and try again.");
    }

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let payload;
    try {
        const response = await fetch(VERIFY_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new RecaptchaVerificationError(
                "Sign-in protection could not be reached. Please try again.",
                { status: 503, code: "RECAPTCHA_UNAVAILABLE" }
            );
        }
        payload = await response.json();
    } catch (error) {
        if (error instanceof RecaptchaVerificationError) throw error;
        throw new RecaptchaVerificationError(
            "Sign-in protection could not be reached. Please try again.",
            { status: 503, code: "RECAPTCHA_UNAVAILABLE" }
        );
    } finally {
        clearTimeout(timeout);
    }

    const minimumScore = Number.parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");
    const scoreThreshold = Number.isFinite(minimumScore) ? minimumScore : 0.5;
    const actionMatches = payload.action === expectedAction;
    const scorePasses = typeof payload.score === "number" && payload.score >= scoreThreshold;

    if (!payload.success || !actionMatches || !scorePasses) {
        console.warn("[reCAPTCHA] Login rejected", {
            action: payload.action,
            score: payload.score,
            errors: payload["error-codes"] || [],
        });
        throw new RecaptchaVerificationError("The security check could not verify this sign-in. Please try again.");
    }

    return {
        success: true,
        action: payload.action,
        score: payload.score,
        hostname: payload.hostname,
    };
}

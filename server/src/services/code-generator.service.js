/**
 * Classgrid — Cryptographically Secure Code Generator
 *
 * Generates exactly 10-character uppercase alphanumeric codes.
 * Uses crypto.randomBytes for true randomness (CSPRNG-backed).
 *
 * Charset: A-Z + 2-9 (confusing O/0/I/1 removed) = 32 characters
 * 10-char code = ~50-bit entropy — secure yet easy to type.
 */

import crypto from "crypto";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 10;

/**
 * Generate a single cryptographically random 10-char code.
 * @returns {string} e.g. "X7K9P2LQ8A"
 */
export const generateSecureCode = () => {
    const bytes = crypto.randomBytes(CODE_LENGTH * 2);
    let code = "";
    let i = 0;
    while (code.length < CODE_LENGTH) {
        const byte = bytes[i++];
        if (byte < 252) {
            code += CHARSET[byte % CHARSET.length];
        }
        if (i >= bytes.length) {
            const extra = crypto.randomBytes(CODE_LENGTH * 2);
            extra.copy(bytes, 0);
            i = 0;
        }
    }
    return code;
};

/**
 * Generate a SINGLE unique organization code (no more dual codes).
 * @param {import('mongoose').Model} OrgModel - The Organization Mongoose model
 * @returns {Promise<{ organizationCode: string }>}
 */
export const generateUniqueOrgCode = async (OrgModel) => {
    let organizationCode;
    let attempts = 0;

    while (true) {
        attempts++;
        if (attempts > 20) {
            throw new Error("Unable to generate unique org code after 20 attempts.");
        }

        organizationCode = generateSecureCode();

        const exists = await OrgModel.exists({
            $or: [
                { organizationCode },
                { private_code: organizationCode },
            ]
        });

        if (!exists) break;
    }

    return { organizationCode };
};

const codeExists = async (OrgModel, code) => {
    return OrgModel.exists({
        $or: [
            { organizationCode: code },
            { honorCode: code },
            { private_code: code },
        ]
    });
};

// Legacy export for backward compatibility
export const generateUniqueDualCodes = async (OrgModel) => {
    const { organizationCode } = await generateUniqueOrgCode(OrgModel);

    let honorCode;
    let attempts = 0;

    while (true) {
        attempts++;
        if (attempts > 20) {
            throw new Error("Unable to generate unique honor code after 20 attempts.");
        }

        const candidate = generateSecureCode();
        if (candidate === organizationCode) continue;

        const exists = await codeExists(OrgModel, candidate);
        if (!exists) {
            honorCode = candidate;
            break;
        }
    }

    return { organizationCode, honorCode };
};

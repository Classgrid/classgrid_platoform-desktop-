/**
 * admission-en-validator.js
 * 
 * Utility to validate DTE Maharashtra EN numbers using MOD-11 checksum.
 * Pattern: EN (Year) (CollegeCode) (SerialNumber) (ChecksumDigit)
 */

export function validateENNumber(en_number, institute_code) {
    if (!en_number) return { valid: false, error: "EN Number is required." };
    
    en_number = en_number.trim().toUpperCase();
    
    // Pattern: EN + Year(2) + Rest(5 to 12 digits)
    // Pattern: EN + Year(2) + College(5) + Serial(4-5) + Checksum(1)
    const pattern = /^EN(\d{2})(\d{5})(\d{4,5})(\d{1})$/;
    const match = en_number.match(pattern);
    
    if (!match) {
        return { valid: false, error: "Invalid EN Number format. Expected: EN + Year + CollegeCode + Serial + Checksum" };
    }

    const [, year, college, serial, checksum] = match;

    // 1. Validate Year
    const currentYear = new Date().getFullYear() % 100;
    const yearNum = parseInt(year);
    if (yearNum !== currentYear && yearNum !== currentYear - 1) {
        return { valid: false, error: `Academic year mismatch: ${year}. Candidate must be from current cycle.` };
    }

    // 2. Validate College Code strictly
    if (institute_code && college !== institute_code) {
        return { valid: false, error: `College code mismatch. This EN belongs to institute ${college}, not ${institute_code}.` };
    }

    // 3. Dynamic MOD-11 Checksum Validation
    // Formula: Sum of (digit * weight) % 11 should match checksum digit.
    const digits = (college + serial).split('').map(Number);
    let sum = 0;
    
    for (let i = 0; i < digits.length; i++) {
        sum += digits[i] * (digits.length - i);
    }

    const calculatedChecksum = sum % 11;
    
    if (parseInt(checksum) !== calculatedChecksum) {
        return { valid: false, error: "EN verification failed: Checksum digit mismatch. Possible typo." };
    }

    return { 
        valid: true, 
        data: { year, college, serial, checksum } 
    };
}

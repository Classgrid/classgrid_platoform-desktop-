import { validateENNumber } from "../src/utils/admission-en-validator.js";

function testValidator() {
    console.log("--- Flexible EN Validator Test ---");

    // Current year is 2026 (% 100 = 26)
    
    // 1. 9-Character Format (Year 26 + Serial 4 chars + Checksum 1)
    // YY: 26, Serial: 1447
    // Input for checksum: "261447"
    // Digits: [2, 6, 1, 4, 4, 7]
    // Weights: 6, 5, 4, 3, 2, 1
    // Sum = 12 + 30 + 4 + 12 + 8 + 7 = 73
    // 73 % 11 = 7
    const validEN9 = "EN2614477";
    const res1 = validateENNumber(validEN9, "1447");
    console.log(`Test 1 (9-char Valid): ${res1.valid ? "✅ PASSED" : "❌ FAILED"} - ${res1.error || ""}`);

    // 2. 10-Character Format (Year 26 + Serial 5 chars + Checksum 1)
    // YY: 26, Serial: 23450
    // Input for checksum: "2623450"
    // Digits: [2, 6, 2, 3, 4, 5, 0]
    // Weights: 7, 6, 5, 4, 3, 2, 1
    // Sum = 14 + 36 + 10 + 12 + 12 + 10 + 0 = 94
    // 94 % 11 = 6
    const validEN10 = "EN26234506";
    const res2 = validateENNumber(validEN10, "2345");
    console.log(`Test 2 (10-char Valid): ${res2.valid ? "✅ PASSED" : "❌ FAILED"} - ${res2.error || ""}`);

    // 3. Serial mismatch (College code part)
    const res3 = validateENNumber(validEN10, "9999");
    console.log(`Test 3 (College Mismatch): ${!res3.valid ? "✅ PASSED" : "❌ FAILED"} - ${res3.error || ""}`);

    // 4. Future proof: 13 characters
    // YY: 26, Serial: 12345678 (8 digits)
    // Input: "2612345678" (10 digits)
    // Sum = 2*10 + 6*9 + 1*8 + 2*7 + 3*6 + 4*5 + 5*4 + 6*3 + 7*2 + 8*1
    // Sum = 20 + 54 + 8 + 14 + 18 + 20 + 20 + 18 + 14 + 8 = 194
    // 194 % 11 = 7
    const validEN13 = "EN26123456787";
    const res4 = validateENNumber(validEN13);
    console.log(`Test 4 (13-char Valid): ${res4.valid ? "✅ PASSED" : "❌ FAILED"} - ${res4.error || ""}`);
}

testValidator();

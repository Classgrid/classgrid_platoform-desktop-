import { google } from "googleapis";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Relies on the JSON credentials we created in server/config/
const KEY_PATH = path.join(__dirname, "../../config/google-service-account.json");

let auth = null;

function getGoogleAuth() {
    if (auth) return auth;
    if (!fs.existsSync(KEY_PATH)) throw new Error("Google Service Account JSON not found in config/google-service-account.json");

    auth = new google.auth.GoogleAuth({
        keyFile: KEY_PATH,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    return auth;
}

export async function fetchSheetData(spreadsheetId) {
    const authClient = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    try {
        // Fetch only the first sheet safely
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "A:Z", 
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) throw new Error("No data found in sheet.");

        const headers = rows[0];
        const data = rows.slice(1);

        return { headers, data };
    } catch (error) {
        console.error("Google Sheets API Error:", error.message);
        throw new Error("Failed to fetch Google Sheet data. Please ensure the email from google-service-account.json has View access to the sheet.");
    }
}

/**
 * Normalizes email and deduplicates by taking the first submission. 
 * Grades based on faculty-defined mappings.
 */
export async function syncAndGradeGoogleSheet(spreadsheetId, mappings, negativeMarks) {
    const { headers, data } = await fetchSheetData(spreadsheetId);

    // Identify standard email column ("Email Address" or similar)
    const emailIndex = headers.findIndex(h => h.toLowerCase().includes("email"));
    if (emailIndex === -1) throw new Error("Could not find an 'Email' column in the Google Sheet. Please add it.");

    // See if Google Forms generated a native "Score" column
    const scoreIndex = headers.findIndex(h => h.toLowerCase().includes("score"));
    const usesNativeScore = scoreIndex !== -1;

    const mappedIndexes = mappings.map(m => ({
        colIndex: headers.indexOf(m.column_name),
        correct_answer: m.correct_answer
    }));

    if (mappedIndexes.some(m => m.colIndex === -1)) {
        throw new Error("One or more mapped columns no longer exist in the Sheet. Please re-check mappings.");
    }

    const processedAttempts = [];
    const seenEmails = new Set();

    for (const row of data) {
        if (!row[emailIndex]) continue;
        const email = row[emailIndex].toLowerCase().trim();

        // First attempt only (ignores subsequent duplicates)
        if (seenEmails.has(email)) continue; 
        seenEmails.add(email);

        let manualScore = 0;
        let responses = [];

        // 1. Process mapped responses (for tracking student answers)
        for (const mapping of mappedIndexes) {
            const studentAns = row[mapping.colIndex] ? row[mapping.colIndex].trim() : "";
            responses.push({ column: headers[mapping.colIndex], selected_answer: studentAns });

            if (studentAns.toLowerCase() === mapping.correct_answer.toLowerCase()) {
                manualScore += 1;
            } else if (studentAns !== "") {
                manualScore -= negativeMarks;
            }
        }

        let finalScore = manualScore;
        let totalMarks = null;

        // 2. Override with native Google Forms score if the column exists
        if (usesNativeScore) {
            const rawScoreText = row[scoreIndex] ? row[scoreIndex].toString().trim() : "0";
            // Parse "40 / 50" -> score=40, totalMarks=50
            const parts = rawScoreText.split('/');
            const parsedScore = parseFloat(parts[0].trim());
            const parsedTotal = parts[1] ? parseFloat(parts[1].trim()) : null;
            if (!isNaN(parsedScore)) finalScore = parsedScore;
            if (parsedTotal && !isNaN(parsedTotal)) totalMarks = parsedTotal;
        }

        processedAttempts.push({
            email,
            score: finalScore,
            total_marks: totalMarks,
            responses
        });
    }

    return processedAttempts;
}

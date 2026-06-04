import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src', 'services', 'admissions');
const inputFile = path.join(srcDir, 'strategy-selector.js');
const strategyDir = path.join(srcDir, 'strategy');

if (!fs.existsSync(strategyDir)) fs.mkdirSync(strategyDir, { recursive: true });

const content = fs.readFileSync(inputFile, 'utf-8');

// 1. Extract FIELD_KEYS
const fieldMatch = content.match(/key:\s*"([^"]+)"/g);
const keys = new Set();
if (fieldMatch) {
    fieldMatch.forEach(m => {
        const match = m.match(/"([^"]+)"/);
        if (match) keys.add(match[1]);
    });
}
const fieldKeysContent = 'export const FIELD_KEYS = {\n' + 
    Array.from(keys).map(k => `    ${k.toUpperCase()}: "${k}",`).join('\n') + 
    '\n};\n';

fs.writeFileSync(path.join(strategyDir, 'constants.js'), fieldKeysContent);
console.log('Constants generated.');

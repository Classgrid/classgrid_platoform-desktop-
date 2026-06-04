import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src', 'services', 'admissions');
const inputFile = path.join(srcDir, 'strategy-selector.js');
const strategyDir = path.join(srcDir, 'strategy');

const content = fs.readFileSync(inputFile, 'utf-8');

// The file has very clear section comments
// // 1. MASTER FIELD POOL
// // 2. MASTER DOCUMENT POOL
// // 3. ORG-TYPE DEFAULTS
// // 4. ADMISSION STRATEGIES
// // 5. EXPORTED FUNCTIONS

const s1 = content.indexOf('// 1. MASTER FIELD POOL');
const s2 = content.indexOf('// 2. MASTER DOCUMENT POOL');
const s3 = content.indexOf('// 3. ORG-TYPE DEFAULTS');
const s4 = content.indexOf('// 4. ADMISSION STRATEGIES');
const s5 = content.indexOf('// 5. EXPORTED FUNCTIONS');

const masterFieldsRaw = content.slice(s1, s2);
const masterDocsRaw = content.slice(s2, s3);
const orgDefaultsRaw = content.slice(s3, s4);
const adminStratsRaw = content.slice(s4, s5);
const exportedFuncsRaw = content.slice(s5);

// Write master-fields.js
fs.writeFileSync(path.join(strategyDir, 'master-fields.js'), 
    `import { FIELD_KEYS } from './constants.js';\n\n` + 
    masterFieldsRaw + 
    `\nexport { DEFAULT_REQUIRED_FIELD_KEYS, MASTER_FIELD_POOL };\n`
);

// Write master-documents.js
fs.writeFileSync(path.join(strategyDir, 'master-documents.js'), 
    masterDocsRaw + 
    `\nexport { MASTER_DOCUMENT_POOL };\n`
);

// Write org-defaults.js
fs.writeFileSync(path.join(strategyDir, 'org-defaults.js'), 
    `import { MASTER_FIELD_POOL, DEFAULT_REQUIRED_FIELD_KEYS } from './master-fields.js';\n\n` + 
    orgDefaultsRaw + 
    `\nexport { MASTER_FIELD_DEFINITION_MAP, ORG_TYPE_DEFAULTS };\n`
);

// Write admission-strategies.js
fs.writeFileSync(path.join(strategyDir, 'admission-strategies.js'), 
    adminStratsRaw + 
    `\nexport { ADMISSION_STRATEGIES };\n`
);

// Write resolver.js
// We need to strip out the old export { ... } from the end
const cleanExported = exportedFuncsRaw.replace(/export \{ MASTER_FIELD_POOL.*?\nexport default ADMISSION_STRATEGIES;/s, '');
fs.writeFileSync(path.join(strategyDir, 'resolver.js'), 
    `import { MASTER_FIELD_POOL, MASTER_FIELD_DEFINITION_MAP, MASTER_DOCUMENT_POOL, ORG_TYPE_DEFAULTS, ADMISSION_STRATEGIES } from './index.js';\n\n` + 
    cleanExported
);

// Write index.js (the unified exporter)
const indexJs = `
export * from './constants.js';
export * from './master-fields.js';
export * from './master-documents.js';
export * from './org-defaults.js';
export * from './admission-strategies.js';
export * from './resolver.js';
`;
fs.writeFileSync(path.join(strategyDir, 'index.js'), indexJs);

console.log('Successfully split into modules.');

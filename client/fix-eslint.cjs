const fs = require('fs');

let content = fs.readFileSync('eslint.config.js', 'utf8');

// Replace the base no-unused-vars rule with the typescript specific one
content = content.replace(
  /'no-unused-vars': \['error', \{ varsIgnorePattern: '\^\[A-Z_\]', argsIgnorePattern: '\^\[A-Z_\]', caughtErrorsIgnorePattern: '\^\[A-Z_\]' \}\],/g,
  "'no-unused-vars': 'off',\n      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]', caughtErrorsIgnorePattern: '^[A-Z_]' }],"
);

fs.writeFileSync('eslint.config.js', content);
console.log("ESLint config updated for TypeScript");

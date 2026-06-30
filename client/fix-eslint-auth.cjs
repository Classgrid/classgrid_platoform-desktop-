const fs = require('fs');

let content = fs.readFileSync('eslint.config.js', 'utf8');

content = content.replace(
  /files: \['src\/components\/marketing_ui\/\*\*\/\*\.\{js,jsx,ts,tsx\}'\]/,
  "files: ['src/components/marketing_ui/**/*.{js,jsx,ts,tsx}', 'src/features/auth/pages/**/*.{js,jsx,ts,tsx}']"
);

fs.writeFileSync('eslint.config.js', content);
console.log('Updated ESLint config!');

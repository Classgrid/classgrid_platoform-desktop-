const fs = require('fs');
const path = require('path');

const authPagesDir = 'src/features/auth/pages';
const files = fs.readdirSync(authPagesDir)
  .filter(f => f.endsWith('.tsx'))
  .map(f => path.join(authPagesDir, f));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // We are reverting `<Button` back to `<button` in auth pages because the custom CSS was highly tuned.
  content = content.replace(/<Button(\s|>)/g, '<button$1');
  content = content.replace(/<\/Button>/g, '</button>');

  // We also need to remove the Button import we just added
  content = content.replace(/import\s*{\s*Button\s*}\s*from\s*['"]@\/components\/marketing_ui\/button['"];?\r?\n?/g, '');

  fs.writeFileSync(file, content);
  console.log('Reverted Button to button in:', file);
}

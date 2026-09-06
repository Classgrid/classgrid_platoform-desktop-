const fs = require('fs');
const path = require('path');

const dir = 'c:\\CLASSGRIDPLATFORM\\classgrid_platoform-desktop-\\client\\src\\features\\superadmin\\pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const importRegex = /import\s+\{\s*RefreshButton\s*\}\s+from\s+["']@\/components\/marketing_ui\/refresh-button["'];?\r?\n?/g;
const componentRegex = /<RefreshButton[^>]*\/>/g;

let totalRemoved = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('RefreshButton')) {
    content = content.replace(importRegex, '');
    content = content.replace(componentRegex, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
    totalRemoved++;
  }
}

console.log(`Total files updated: ${totalRemoved}`);

const fs = require('fs');
const path = require('path');

function countLines(dir, extensions) {
  let totalLines = 0;
  let totalFiles = 0;

  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
        walk(fullPath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (extensions.includes(ext)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n').length;
          totalLines += lines;
          totalFiles++;
        }
      }
    }
  }

  walk(dir);
  return { totalLines, totalFiles };
}

const exts = ['.js', '.ts', '.jsx', '.tsx'];
const baseDir = path.resolve(__dirname, '..');
const clientDir = path.join(baseDir, 'client/src');
const serverDir = path.join(baseDir, 'server/src');

console.log('Counting lines of code...');
try {
  const clientRes = countLines(clientDir, exts);
  console.log(`Client (client/src) : ${clientRes.totalLines.toLocaleString()} lines in ${clientRes.totalFiles} files`);
} catch (e) {
  console.error('Error reading client/src:', e.message);
}

try {
  const serverRes = countLines(serverDir, exts);
  console.log(`Server (server/src) : ${serverRes.totalLines.toLocaleString()} lines in ${serverRes.totalFiles} files`);
} catch (e) {
  console.error('Error reading server/src:', e.message);
}

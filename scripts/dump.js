const fs = require('fs');
const path = './server/src/models';
const files = fs.readdirSync(path);
let out = '';
files.forEach(f => {
  if (f.endsWith('.js')) {
    const code = fs.readFileSync(`${path}/${f}`, 'utf8');
    const lines = code.split('\n').filter(l => l.includes('type:') || l.includes('enum:')).slice(0, 10);
    out += `\n--- ${f} ---\n${lines.join('\n')}`;
  }
});
fs.writeFileSync('schema_dump.txt', out);

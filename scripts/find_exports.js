const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let allExports = new Set();
walkDir('client/src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let regex = /import\s+\{([^}]+)\}\s+from\s+["']@\/components\/classgrid["']/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            let items = match[1].split(',');
            items.forEach(item => {
                let clean = item.trim();
                if (clean) {
                    if (clean.includes(' as ')) {
                        allExports.add(clean.split(' as ')[0].trim());
                    } else {
                        allExports.add(clean);
                    }
                }
            });
        }
    }
});
console.log(Array.from(allExports).join(', '));

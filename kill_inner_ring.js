const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'src', 'features', 'auth', 'pages');

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find inputs that have "outline-none" and add "focus:ring-0 border-none focus:border-transparent"
        // so that global forms plugins don't add inner borders on focus.
        
        const searchRegex = /className="(.*?outline-none.*?)"/g;
        
        content = content.replace(searchRegex, (match, p1) => {
            if (p1.includes('focus:ring-0')) return match;
            return `className="${p1} focus:ring-0 border-none focus:border-transparent"`;
        });
        
        fs.writeFileSync(filePath, content, 'utf8');
    }
});

console.log('Killed inner focus ring on all auth inputs!');

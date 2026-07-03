const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'src', 'features', 'auth', 'pages');

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Let's add inline style to forcefully kill the shadow and border from Tailwind forms
        const searchRegex = /<input(.*?)className="(.*?outline-none.*?)"(.*?)>/g;
        
        content = content.replace(searchRegex, (match, p1, p2, p3) => {
            if (match.includes('style={{')) return match;
            return `<input${p1}className="${p2}" style={{ boxShadow: 'none', border: 'none', outline: 'none' }}${p3}>`;
        });
        
        fs.writeFileSync(filePath, content, 'utf8');
    }
});

console.log('Forcefully killed inner focus ring on all auth inputs using inline styles!');

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'src', 'features', 'auth', 'pages');

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Let's add focus-within classes to the input wrapper divs.
        // The wrapper div class signature is typically:
        // "flex h-[46px] items-center gap-3 rounded-[12px] border border-border dark:border-white/[0.14] bg-background dark:bg-[#141414] px-4"
        // We will replace it with the same string + focus-within classes
        
        const searchRegex = /className="(.*?flex h-\[46px\] items-center gap-3 rounded-\[12px\] border border-border.*?px-4)"/g;
        
        content = content.replace(searchRegex, (match, p1) => {
            // Only add if not already added
            if (p1.includes('focus-within:')) return match;
            return `className="${p1} transition-colors focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50"`;
        });
        
        fs.writeFileSync(filePath, content, 'utf8');
    }
});

console.log('Fixed focus ring on all login inputs!');

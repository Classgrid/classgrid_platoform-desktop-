const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'src', 'features', 'auth', 'pages');

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Fix 1: change dark:text-[#ededed] to dark:text-white
        content = content.replace(/dark:text-\[\#ededed\]/g, 'dark:text-white');
        
        // Fix 2: change dark:text-white/40 which is meant for placeholders
        content = content.replace(/placeholder:text-muted-foreground dark:text-white\/40/g, 'placeholder:text-muted-foreground dark:placeholder-white/40');
        
        fs.writeFileSync(filePath, content, 'utf8');
    }
});

console.log('Fixed input text colors in all auth pages!');

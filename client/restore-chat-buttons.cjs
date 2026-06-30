const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file uses <Button
    if (content.includes('<Button') || content.includes('import { Button }')) {
        // Remove import { Button }
        content = content.replace(/import\s+\{\s*Button\s*\}\s+from\s+['"]@\/components\/marketing_ui\/button['"];\n?/g, '');
        
        // Replace <Button> with <button>
        content = content.replace(/<Button/g, '<button');
        content = content.replace(/<\/Button>/g, '</button>');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Restored buttons in: ${filePath}`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

traverseDir(path.join(__dirname, 'src/features/chat/components'));

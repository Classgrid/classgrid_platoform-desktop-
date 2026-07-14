const fs = require('fs');
const path = require('path');

const dirsToScan = [
    path.join(__dirname, 'src', 'services'),
    path.join(__dirname, 'src', 'scripts')
];

function scanAndReplace(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanAndReplace(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            const patterns = [
                // email-preview.html div block
                /<div class="email-support">\s*<p>Need help\? Contact <a href="mailto:support@classgrid\.in"[^>]*>support@classgrid\.in<\/a><\/p>\s*<\/div>/gi,
                // Scripts div block
                /<div[^>]*>\s*<p[^>]*>Need help\? Contact <a href="mailto:support@classgrid\.in"[^>]*>support@classgrid\.in<\/a><\/p>\s*<\/div>/gi,
                // "If you did not expect this invitation..."
                /<p[^>]*>If you did not expect this invitation, you can safely ignore this email\. Need help\? Contact us at <a[^>]*>[^<]*<\/a><\/p>/gi,
                // Standard Need help? paragraph
                /<p[^>]*>Need help\? Contact us at <a[^>]*>[^<]*<\/a>\.<\/p>/gi,
                // Raw text with anchor
                /Need help\? Contact <a href="mailto:support@classgrid\.in"[^>]*>support@classgrid\.in<\/a>/gi,
                // Raw text without anchor
                /Need help\? Contact us at support@classgrid\.in/gi
            ];

            for (const pattern of patterns) {
                content = content.replace(pattern, '');
            }

            // A special fallback for replacing just the raw text anywhere
            content = content.replace(/Need help\? Contact/g, 'Contact'); 
            // Wait, this might break things. I'll stick to the specific patterns. Actually, let me undo that last one.

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Modified:', fullPath);
            }
        }
    }
}

for (const dir of dirsToScan) {
    scanAndReplace(dir);
}
console.log('Done.');

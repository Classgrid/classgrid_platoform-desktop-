const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'services', 'email-templates.service.js');
let content = fs.readFileSync(file, 'utf8');

// Replace the HTML paragraph wrapping the text
content = content.replace(/<p[^>]*>\s*Need help\? Raise a ticket on our Support Portal:?\s*(<a[^>]*>[^<]*<\/a>|https:\/\/classgrid\.in\/support)\.?\s*<\/p>/gi, '');

// Replace any bare text occurrences
content = content.replace(/Need help\? Raise a ticket on our Support Portal:?\s*(<a[^>]*>[^<]*<\/a>|https:\/\/classgrid\.in\/support)/gi, '');

// One more fallback for just the prefix
content = content.replace(/Need help\? Raise a ticket on our Support Portal:?/gi, '');

fs.writeFileSync(file, content);
console.log('Removed Raise a Ticket text from email-templates.service.js');

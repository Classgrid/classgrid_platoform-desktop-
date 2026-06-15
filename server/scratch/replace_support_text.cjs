const fs = require('fs');
const file = 'server/src/services/email-templates.service.js';
let content = fs.readFileSync(file, 'utf8');

// Replace plain text versions
content = content.replace(/Need help\? Contact https:\/\/classgrid\.in\/support/g, 'Need help? Raise a ticket on our Support Portal: https://classgrid.in/support');

// Replace HTML versions
content = content.replace(/Need help\? Contact <a href="https:\/\/classgrid\.in\/support" style="color:#ffffff;text-decoration:none;">https:\/\/classgrid\.in\/support<\/a>/g, 'Need help? Raise a ticket on our Support Portal: <a href="https://classgrid.in/support" style="color:#ffffff;text-decoration:underline;">https://classgrid.in/support</a>');

// Just in case there are other variations
content = content.replace(/Contact https:\/\/classgrid\.in\/support/g, 'Raise a ticket on our Support Portal: https://classgrid.in/support');

fs.writeFileSync(file, content);
console.log('Replaced support text');

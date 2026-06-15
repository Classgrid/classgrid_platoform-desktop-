const fs = require('fs');
const file = 'server/src/services/email-templates.service.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/mailto:support@classgrid\.in/g, 'https://classgrid.in/support');
content = content.replace(/>support@classgrid\.in</g, '>https://classgrid.in/support<');
content = content.replace(/Contact support@classgrid\.in/g, 'Contact https://classgrid.in/support');
content = content.replace(/contact us at support@classgrid\.in/g, 'contact us at https://classgrid.in/support');
content = content.replace(/mail us at: support@classgrid\.in/g, 'visit: https://classgrid.in/support');
content = content.replace(/Email: <a href="https:\/\/classgrid\.in\/support" style="color:#ffffff;">https:\/\/classgrid\.in\/support<\/a>/g, 'Support: <a href="https://classgrid.in/support" style="color:#ffffff;">https://classgrid.in/support</a>');

fs.writeFileSync(file, content);
console.log('Done replacing emails');

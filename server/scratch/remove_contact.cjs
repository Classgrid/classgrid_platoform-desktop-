const fs = require('fs');
const file = 'server/src/services/email-templates.service.js';
let content = fs.readFileSync(file, 'utf8');

// Replace "contact us at https://classgrid.in/support" with "visit https://classgrid.in/support"
content = content.replace(/contact us at https:\/\/classgrid\.in\/support/g, 'raise a ticket at https://classgrid.in/support');

// Replace "contact your institution administrator" with "reach out to your institution administrator"
content = content.replace(/contact your institution administrator/gi, 'reach out to your institution administrator');

// Replace any leftover standalone "Contact https://classgrid.in/support" with "Raise a ticket on our Support Portal: https://classgrid.in/support"
content = content.replace(/Contact https:\/\/classgrid\.in\/support/gi, 'Raise a ticket on our Support Portal: https://classgrid.in/support');

fs.writeFileSync(file, content);
console.log('Removed contact word');

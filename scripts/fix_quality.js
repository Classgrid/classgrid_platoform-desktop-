const fs = require('fs');
const filePath = 'client/src/features/superadmin/components/org-details/OrgOverviewTab.tsx';
let content = fs.readFileSync(filePath, 'utf-8');
content = content.replace(/"Not Configured"/g, '"unavailable"');
fs.writeFileSync(filePath, content);

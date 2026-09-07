const fs = require('fs');
const path = require('path');

const pages = [
  'OrgHierarchyPage.tsx',
  'OrgFacultyPage.tsx',
  'OrgStudentsPage.tsx',
  'OrgFeesPage.tsx',
  'OrgAdmissionsPage.tsx'
];

const dir = 'client/src/features/superadmin/pages/';

for (const page of pages) {
  const filePath = path.join(dir, page);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace breadcrumbs to include "Configuration"
  content = content.replace(
    /<Link to={\/superadmin\/detail\/\} className="hover:text-foreground transition-colors cursor-pointer">\{orgName\}<\/Link>/,
    '<Link to={/superadmin/detail/} className="hover:text-foreground transition-colors cursor-pointer">{orgName}</Link>\n          <span className="mx-2 text-muted-foreground/50">/</span>\n          <Link to={/superadmin/detail/?tab=configuration} className="hover:text-foreground transition-colors cursor-pointer">Configuration</Link>'
  );

  fs.writeFileSync(filePath, content);
}

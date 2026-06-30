const fs = require('fs');
const files = [
  'src/features/student/pages/StudentWorkPage.tsx',
  'src/features/faculty/pages/FacultyWorkPage.tsx',
  'src/features/superadmin/pages/SupportTicketsPage.tsx',
  'src/features/superadmin/pages/ClassgridTalkPage.tsx'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import\s*\{\s*Breadcrumb[^}]*\}\s*from\s*['"]@\/components\/marketing_ui\/breadcrumb['"];?\n?/g, '');
  content = content.replace(/<Breadcrumb>[\s\S]*?<\/Breadcrumb>/g, '');
  fs.writeFileSync(file, content);
}

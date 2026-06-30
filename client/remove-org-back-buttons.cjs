const fs = require('fs');
const file = 'src/features/superadmin/pages/OrgDetailPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the loading back button container
content = content.replace(
  /<div className="flex border-b border-border pb-4">[\s\S]*?<Button variant="ghost" onClick=\{\(\) => navigate\(-1\)\}>[\s\S]*?<ArrowLeft size=\{14\} className="mr-2" \/> Back[\s\S]*?<\/Button>[\s\S]*?<\/div>/g,
  ''
);

// 2. Remove the "All Orgs" back button in the header
content = content.replace(
  /<Button variant="ghost" asChild>\s*<Link to="\/superadmin\/orgs"><ArrowLeft size=\{14\} className="mr-2" \/> All Orgs<\/Link>\s*<\/Button>/g,
  ''
);

// 3. Remove the "Back to All Organizations" button at the bottom
content = content.replace(
  /<Button variant="ghost" className="justify-start" asChild>\s*<Link to="\/superadmin\/orgs">\s*<ArrowLeft size=\{14\} className="mr-2" \/> Back to All Organizations\s*<\/Link>\s*<\/Button>/g,
  ''
);

fs.writeFileSync(file, content);
console.log("Done");

const fs = require('fs');

const files = [
  'src/features/superadmin/pages/SupportTicketsPage.tsx',
  'src/features/superadmin/pages/ClassgridTalkPage.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix Eye Button stretching
  content = content.replace(
    /className="p-1 rounded-md hover:bg-primary\/10 text-muted-foreground hover:text-primary transition-colors"/g,
    'className="w-7 h-7 p-0 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"'
  );
  
  fs.writeFileSync(file, content);
}
console.log("Fixed eye button stretch");

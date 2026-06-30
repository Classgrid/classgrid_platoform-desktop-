const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace raw buttons with Button component
  content = content.replace(/<button/g, '<Button');
  content = content.replace(/<\/button>/g, '</Button>');

  // Clean up styles
  content = content.replace(/style=\{\{[^}]+\}\}/g, '');

  // Fix known classNames to Shadcn variants
  content = content.replace(/className=\"inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2--ghost\"/g, 'variant=\"ghost\" size=\"icon\"');
  content = content.replace(/className=\"inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground\"/g, 'variant=\"outline\"');
  content = content.replace(/className=\"inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow\"/g, 'variant=\"default\"');
  content = content.replace(/className=\"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2\"/g, 'variant=\"outline\"');
  content = content.replace(/className=\"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary\/90 h-9 px-4 py-2\"/g, 'variant=\"default\"');
  
  // Clean up inputs
  content = content.replace(/<input /g, '<Input ');
  
  // Add Input import if needed
  if (content.includes('<Input ') && !content.includes('import { Input }')) {
    if (content.includes('import { Button } from "@/components/marketing_ui/button";')) {
      content = content.replace('import { Button } from "@/components/marketing_ui/button";', 'import { Button } from "@/components/marketing_ui/button";\nimport { Input } from "@/components/marketing_ui/input";');
    } else {
      content = 'import { Input } from "@/components/marketing_ui/input";\n' + content;
    }
  }

  // Add Select import if needed
  if (content.includes('import { Select, ') || content.includes('import { Select }')) {
    // Already has select
  } else if (content.includes('<Select') && !content.includes('import { Select }')) {
    content = 'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";\n' + content;
  }

  fs.writeFileSync(filePath, content);
}

const files = [
  'src/features/superadmin/pages/LeadsPage.tsx',
  'src/features/superadmin/pages/SupportTicketsPage.tsx',
  'src/features/superadmin/pages/DirectOnboardPage.tsx',
  'src/features/superadmin/pages/BackupPage.tsx',
  'src/features/superadmin/pages/ClassgridTalkPage.tsx',
  'src/features/superadmin/pages/AuditPage.tsx',
  'src/features/superadmin/pages/AlertsPage.tsx',
  'src/features/superadmin/pages/ActivityLogPage.tsx',
  'src/features/superadmin/pages/UsersPage.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    console.log('Fixing', f);
    fixFile(f);
  }
});

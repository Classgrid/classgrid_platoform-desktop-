const fs = require('fs');
const files = [
  'src/features/superadmin/pages/AuditPage.tsx',
  'src/features/superadmin/pages/ConfigPage.tsx',
  'src/features/superadmin/pages/DirectOnboardPage.tsx',
  'src/features/superadmin/pages/OrgDetailPage.tsx',
  'src/features/superadmin/pages/ReviewsPage.tsx',
  'src/features/superadmin/pages/SystemHealthPage.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  if (content.includes('<Input') && !content.includes('import { Input }')) {
    content = 'import { Input } from "@/components/marketing_ui/input";\n' + content;
    changed = true;
  }
  if (content.includes('<Select') && !content.includes('import { Select }') && !content.includes('import { Select,')) {
    content = 'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";\n' + content;
    changed = true;
  }
  if (changed) { fs.writeFileSync(f, content); console.log('Added imports to', f); }
});

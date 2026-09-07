const fs = require('fs');
const path = require('path');
const targetFiles = [
  'features/faculty/pages/FacultyHomePage.tsx',
  'features/student/pages/StudentHomePage.tsx'
];

targetFiles.forEach(file => {
  const fullPath = path.join('c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/client/src', file);
  if (fs.existsSync(fullPath)) {
    const componentNameMatch = fs.readFileSync(fullPath, 'utf8').match(/export function ([A-Za-z0-9_]+)/);
    const componentName = componentNameMatch ? componentNameMatch[1] : 'DashboardComponent';
    
    const content = `import { AskAiPanel } from "@/components/ai/components/AskAiPanel";

export function ${componentName}() {
  return (
    <div className="flex flex-col w-full h-[calc(100vh-theme(spacing.16))] relative bg-background">
      <AskAiPanel 
        open={true} 
        onOpenChange={() => {}} 
        variant="full-page"
        pageContext={{
          title: "${componentName}"
        }}
      />
    </div>
  );
}
`;
    fs.writeFileSync(fullPath, content);
    console.log('Replaced ' + file);
  } else {
    console.log('Not found: ' + file);
  }
});

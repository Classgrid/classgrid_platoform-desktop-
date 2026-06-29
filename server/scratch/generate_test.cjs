const fs = require('fs');

const createTestPage = (sourceFile, targetComponent, targetFile) => {
  let content = fs.readFileSync(`c:/Users/nikhi/OneDrive/Documents/Classgrid_platfrom/classgrid_platform/client/src/features/auth/pages/${sourceFile}`, 'utf8');

  // Replace the component name
  content = content.replace(new RegExp(`export function ${sourceFile.replace('.tsx', '')}`, 'g'), `export function ${targetComponent}`);

  // Replace the state to include hardcoded branding with a working logo
  content = content.replace(
    /const \[branding, setBranding\] = useState<AuthBranding \| null>\(null\);/g,
    `const [branding, setBranding] = useState<AuthBranding | null>({
      name: 'Greenfield University',
      siteTitle: 'Greenfield Portal',
      logoUrl: 'https://ui-avatars.com/api/?name=Greenfield+University&background=10b981&color=fff&size=150',
      faviconUrl: '',
      campusImageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=550&h=720&auto=format&fit=crop'
    });`
  );

  // Comment out the getAuthBranding API call inside the useEffect
  content = content.replace(
    /getAuthBranding\(\{ authType: "institution", slug, domain: customDomain \}\)[\s\S]*?\.catch\(\(\) => \{\s*if \(isMounted\) setBrandingError\(true\);\s*\}\);/g,
    `// getAuthBranding API call temporarily removed to use placeholder testing data`
  );

  fs.writeFileSync(`c:/Users/nikhi/OneDrive/Documents/Classgrid_platfrom/classgrid_platform/client/src/features/auth/pages/${targetFile}`, content);
};

// Create User Test Page
createTestPage('CustomDomainUserLoginPage.tsx', 'TestCustomUserPage', 'TestCustomUserPage.tsx');

// Create Admin Test Page
createTestPage('CustomDomainAdminLoginPage.tsx', 'TestCustomAdminPage', 'TestCustomAdminPage.tsx');

console.log("Done generating both test pages");

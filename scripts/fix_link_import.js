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
  
  if (!content.includes(' Link ')) {
    content = content.replace(
      /import { useParams, useNavigate, useLocation } from "react-router-dom";/,
      'import { useParams, useNavigate, useLocation, Link } from "react-router-dom";'
    );
    fs.writeFileSync(filePath, content);
  }
}

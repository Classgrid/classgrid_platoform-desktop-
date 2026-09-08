const fs = require('fs');

// 1. Clean sidebar.ts
let sidebarContent = fs.readFileSync('client/src/config/sidebar.ts', 'utf8');
// Remove { label: "Agent", ... } and { label: "Classgrid AI", ... } and { label: "What's New", ... }
sidebarContent = sidebarContent.replace(/\s*\{\s*label:\s*"(Agent|Classgrid AI|What's New)".*?\},?/g, '');
fs.writeFileSync('client/src/config/sidebar.ts', sidebarContent);

// 2. Clean AppSidebar.tsx
let appSidebarContent = fs.readFileSync('client/src/components/layout/AppSidebar.tsx', 'utf8');
appSidebarContent = appSidebarContent.replace(/import \{ AgentNestedMenu \} from "@\/components\/ai\/components\/AgentSidebar";/, '');
appSidebarContent = appSidebarContent.replace(/const agentItem = config\?\.sections\.flatMap\(s => s\.items\)\.find\(i => i\.label === "Agent"\);/g, 'const agentItem = null;');
appSidebarContent = appSidebarContent.replace(/const \[showAgentMenu, setShowAgentMenu\] = useState\(isAgentPage\);/g, 'const showAgentMenu = false; const setShowAgentMenu = () => {};');
appSidebarContent = appSidebarContent.replace(/<AgentNestedMenu searchQuery=\{searchQuery\} \/>/g, 'null');
appSidebarContent = appSidebarContent.replace(/} else if \(item\.label === "Agent"\) \{\s*e\.preventDefault\(\);\s*setShowAgentMenu\(true\);\s*}/g, '');
fs.writeFileSync('client/src/components/layout/AppSidebar.tsx', appSidebarContent);

console.log("Cleanup done!");

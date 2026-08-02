const fs = require('fs');
const path = require('path');

const files = [
  "visual-bible/page.tsx",
  "storyboard/review/page.tsx",
  "storyboard/page.tsx",
  "shots/review/page.tsx",
  "shots/page.tsx",
  "script/page.tsx",
  "scenes/review/page.tsx",
  "scenes/page.tsx",
  "prompts/review/page.tsx",
  "prompts/page.tsx",
  "intelligence/page.tsx"
];

const basePath = "d:\\Workstation DP-2\\DP Clients\\WEB DEVELOPMENT\\PRODUCTION  OS\\src\\app\\projects\\[id]";

for (const file of files) {
  const filePath = path.join(basePath, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove import
    content = content.replace(/import\s+{\s*StageHeader\s*}\s+from\s+["']@\/components\/production\/StageHeader["'];?\r?\n?/g, '');
    
    // Remove StageHeader JSX (handles multiline)
    content = content.replace(/<StageHeader[^>]*\/>\r?\n?/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed ${file}`);
  }
}

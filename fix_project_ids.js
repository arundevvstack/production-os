const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Pattern: const newProjectId = generateId(); then id: newProjectId,
  if (content.includes('const newProjectId = generateId()')) {
    content = content
      .replace(/const newProjectId = generateId\(\);[\r\n\s]*/g, '')
      .replace(/\s*id: newProjectId,[\r\n]*/g, '\n');
    changed = true;
  }

  // Pattern: const newId = generateId(); then id: newId,
  if (content.includes('const newId = generateId()')) {
    content = content
      .replace(/const newId = generateId\(\);[\r\n\s]*/g, '')
      .replace(/\s*id: newId,[\r\n]*/g, '\n');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Fixed ${filePath}`);
  } else {
    console.log(`- No changes needed in ${filePath}`);
  }
}

const files = [
  'src/app/(dashboard)/projects/page.tsx',
  'src/app/(dashboard)/crm/page.tsx',
  'src/app/(dashboard)/crm/[prospectId]/page.tsx',
  'src/app/(dashboard)/clients/page.tsx',
];

for (const f of files) {
  try { fixFile(f); } catch(e) { console.error(`Error on ${f}:`, e.message); }
}
console.log('\nDone!');

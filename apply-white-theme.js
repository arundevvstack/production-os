const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/app/(dashboard)/accounts/page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// The user wants an "all white design" for Accounts & Finance

// 1. Replace obsidian-panel with bg-white
content = content.replace(/obsidian-panel/g, 'bg-white');

// 2. Replace border-white/5 and border-white/10 with border-slate-200
content = content.replace(/border-white\/5/g, 'border-slate-200');
content = content.replace(/border-white\/10/g, 'border-slate-200');

// 3. Text colors in cards: text-white -> text-slate-900
// Note: We need to be careful. Some text-white is on primary buttons.
// Let's replace 'text-white' when it's next to bg-white or border-slate-200.
// A simpler way: we know 'obsidian-panel text-white' was used.
content = content.replace(/bg-white text-white/g, 'bg-white text-slate-900');
content = content.replace(/bg-white rounded-\[10px\] overflow-hidden text-white/g, 'bg-white rounded-[10px] overflow-hidden text-slate-900');
content = content.replace(/bg-white rounded-\[10px\] text-white/g, 'bg-white rounded-[10px] text-slate-900');

// Replace remaining card text-white occurrences that were inside obsidian-panel
content = content.replace(/<h2 className="([^"]*)text-white([^"]*)">/g, '<h2 className="$1text-slate-900$2">');
content = content.replace(/<h3 className="([^"]*)text-white([^"]*)">/g, '<h3 className="$1text-slate-900$2">');
content = content.replace(/<h4 className="([^"]*)text-white([^"]*)">/g, '<h4 className="$1text-slate-900$2">');
content = content.replace(/<p className="([^"]*)text-white([^"]*)">/g, '<p className="$1text-slate-900$2">');
content = content.replace(/<span className="([^"]*)text-white([^"]*)">/g, '<span className="$1text-slate-900$2">');
content = content.replace(/<div className="([^"]*)text-white([^"]*)">/g, '<div className="$1text-slate-900$2">');

// For specific occurrences like `text-4xl font-black tracking-tighter text-white`
content = content.replace(/text-white/g, (match, offset, string) => {
    // Only replace if it's inside a heading or generic text class, NOT buttons (bg-primary, bg-slate-900)
    // Actually, simple text replacement is risky. Let's do it targeted.
    return match;
});

// Let's do manual target replacements for the remaining text-white that should be slate-900:
content = content.replace(/text-4xl font-black tracking-tighter text-white/g, 'text-4xl font-black tracking-tighter text-slate-900');
content = content.replace(/text-sm font-black text-white/g, 'text-sm font-black text-slate-900');
content = content.replace(/font-black text-3xl tracking-tighter text-white/g, 'font-black text-3xl tracking-tighter text-slate-900');
content = content.replace(/text-base font-black text-white/g, 'text-base font-black text-slate-900');
content = content.replace(/text-3xl font-black tracking-tighter text-white/g, 'text-3xl font-black tracking-tighter text-slate-900');
content = content.replace(/text-4xl font-black text-white/g, 'text-4xl font-black text-slate-900');
content = content.replace(/text-[11px] font-black text-slate-500/g, 'text-[11px] font-black text-slate-500'); // keeping this
content = content.replace(/hover:bg-slate-900/g, 'hover:bg-slate-50');
content = content.replace(/bg-slate-900\/50/g, 'bg-slate-50/50');
content = content.replace(/hover:bg-white\/5/g, 'hover:bg-slate-50');

// shadow-3xl -> shadow-xl
content = content.replace(/shadow-3xl/g, 'shadow-xl');

// Write back
fs.writeFileSync(targetFile, content, 'utf8');
console.log('White design applied.');

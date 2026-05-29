const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;
    
    // Replace bg-white/x with dark aware equivalents (using slate-900 or slate-800 depending on opacity)
    content = content.replace(/bg-white\/90(?!\s*dark:)/g, 'bg-white/90 dark:bg-slate-900/90');
    content = content.replace(/bg-white\/80(?!\s*dark:)/g, 'bg-white/80 dark:bg-slate-900/80');
    content = content.replace(/bg-white\/60(?!\s*dark:)/g, 'bg-white/60 dark:bg-slate-900/60');
    content = content.replace(/bg-white\/50(?!\s*dark:)/g, 'bg-white/50 dark:bg-slate-900/50');
    content = content.replace(/bg-white\/40(?!\s*dark:)/g, 'bg-white/40 dark:bg-slate-900/40');
    content = content.replace(/bg-white\/30(?!\s*dark:)/g, 'bg-white/30 dark:bg-slate-900/30');
    content = content.replace(/bg-white\/20(?!\s*dark:)/g, 'bg-white/20 dark:bg-slate-900/20');
    content = content.replace(/bg-white\/10(?!\s*dark:)/g, 'bg-white/10 dark:bg-slate-900/10');
    content = content.replace(/bg-white\/5(?!\s*dark:)/g, 'bg-white/5 dark:bg-slate-900/5');
    
    // Replace solid bg-white
    content = content.replace(/bg-white(?!\/)(?!\s*dark:)/g, 'bg-white dark:bg-slate-900');
    
    // Replace ring-white and border-white/x
    content = content.replace(/ring-white(?!\s*dark:)/g, 'ring-white dark:ring-slate-900');
    content = content.replace(/border-white\/60(?!\s*dark:)/g, 'border-white/60 dark:border-slate-700/60');
    content = content.replace(/border-white\/40(?!\s*dark:)/g, 'border-white/40 dark:border-slate-700/40');
    content = content.replace(/border-white\/20(?!\s*dark:)/g, 'border-white/20 dark:border-slate-700/20');
    content = content.replace(/border-white\/10(?!\s*dark:)/g, 'border-white/10 dark:border-slate-700/10');
    content = content.replace(/border-white(?!\/)(?!\s*dark:)/g, 'border-white dark:border-slate-800');
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Processed', filePath);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

processDirectory(path.join(__dirname, 'src', 'app', '(dashboard)'));
processDirectory(path.join(__dirname, 'src', 'components'));

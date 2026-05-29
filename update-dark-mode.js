const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace bg-white/50 with dark aware
    content = content.replace(/bg-white\/50/g, 'bg-white/50 dark:bg-slate-900/50');
    // Replace bg-white/40
    content = content.replace(/bg-white\/40/g, 'bg-white/40 dark:bg-slate-900/40');
    // Replace ring-white
    content = content.replace(/ring-white/g, 'ring-white dark:ring-slate-900');
    
    // For exact bg-white that aren't part of another string, it's safer to just do a smart regex:
    // This looks for "bg-white" not followed by a slash.
    content = content.replace(/bg-white(?!\/)/g, 'bg-white dark:bg-slate-900');
    // For border-white/60
    content = content.replace(/border-white\/60/g, 'border-white/60 dark:border-slate-700/60');
    // For text-black
    content = content.replace(/text-black/g, 'text-black dark:text-white');
    // For border-white
    content = content.replace(/border-white(?!\/)/g, 'border-white dark:border-slate-800');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Processed', filePath);
}

processFile(path.join(__dirname, 'src', 'app', '(dashboard)', 'settings', 'page.tsx'));
processFile(path.join(__dirname, 'src', 'app', '(dashboard)', 'projects', 'page.tsx'));
processFile(path.join(__dirname, 'src', 'components', 'layout', 'app-sidebar.tsx'));

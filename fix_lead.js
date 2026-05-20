const fs = require('fs'); 
const path = require('path'); 

function walk(dir) { 
  let results = []; 
  const list = fs.readdirSync(dir); 
  list.forEach(file => { 
    file = dir + '/' + file; 
    const stat = fs.statSync(file); 
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file)); 
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file); 
    } 
  }); 
  return results; 
} 

const files = walk('src'); 
let count = 0;
files.forEach(file => { 
  let content = fs.readFileSync(file, 'utf8'); 
  let modified = false; 
  if (content.includes("'Lead'")) { 
    content = content.replace(/'Lead'/g, "'Prospect'"); 
    modified = true; 
  } 
  if (content.includes('"Lead"')) { 
    content = content.replace(/"Lead"/g, '"Prospect"'); 
    modified = true; 
  } 
  if (modified) {
    fs.writeFileSync(file, content); 
    count++;
  }
}); 
console.log('Replaced Lead with Prospect in ' + count + ' files');

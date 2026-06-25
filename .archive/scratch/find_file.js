import fs from 'fs';
import path from 'path';

function findFile(dir, pattern) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findFile(fullPath, pattern);
    } else {
      if (file.toLowerCase().includes(pattern.toLowerCase())) {
        console.log(`Found match: ${fullPath} (${stat.size} bytes)`);
      }
    }
  }
}

console.log('Searching for btn_panel_misc...');
findFile('.', 'btn_panel_misc');
console.log('Searching for bg_main...');
findFile('.', 'bg_main');
console.log('Search complete.');

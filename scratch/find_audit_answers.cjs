const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\0a09938f-a8b0-43ff-85ff-711e5edd14d8';
const files = fs.readdirSync(brainDir);

files.forEach(file => {
  if (file.endsWith('.md')) {
    const fullPath = path.join(brainDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('=== BUNDLE') || content.includes('1.') || content.includes('BUNDLE И ЗАГРУЗКА')) {
      console.log(`Match in file: ${file}`);
      // Print first 5 lines and any line containing "JS files" or "самых"
      const lines = content.split('\n');
      console.log('First 5 lines:');
      console.log(lines.slice(0, 5).join('\n'));
      console.log('---');
    }
  }
});

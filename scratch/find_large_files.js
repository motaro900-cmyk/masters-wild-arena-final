const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        getFiles(fullPath, files);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

const allFiles = getFiles('.');
const fileLineCounts = allFiles.map(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').length;
  const relPath = './' + path.relative('.', file).replace(/\\/g, '/');
  return { file: relPath, lines };
});

fileLineCounts.sort((a, b) => b.lines - a.lines);

const topFiles = fileLineCounts.slice(0, 40);
let totalLines = 0;
topFiles.forEach(item => {
  totalLines += item.lines;
  console.log(`${String(item.lines).padStart(7)} ${item.file}`);
});
console.log(`${String(totalLines).padStart(7)} total`);

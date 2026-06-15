const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles(path.join(__dirname, '../src'));
const candidates = [];

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("addEventListener('resize'") || content.includes('addEventListener("resize"')) {
    const relative = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
    const hasRemove = content.includes("removeEventListener('resize'") || content.includes('removeEventListener("resize"');
    candidates.push({
      file: relative,
      hasRemove: hasRemove ? '✅ OK (Cleaned up)' : '❌ NO CLEANUP'
    });
  }
});

candidates.forEach(c => {
  console.log(`${c.hasRemove}: ${c.file}`);
});

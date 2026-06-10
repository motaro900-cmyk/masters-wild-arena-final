const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.gemini')) {
        results = results.concat(getFiles(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = getFiles('C:\\Users\\Motar\\Desktop\\Masters of the Wild\\src');
const query = process.argv[2] || 'recordResult';

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes(query)) {
    console.log(`Found in: ${f}`);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes(query)) {
        console.log(`  L${idx + 1}: ${line.trim()}`);
      }
    });
  }
});

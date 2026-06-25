const fs = require('fs');

const content = fs.readFileSync('src/configs/AssetsMap.ts', 'utf8');

// Match all single/double quoted strings ending with image extensions
const rx = /['"](\/assets\/.*?\.(png|jpg|jpeg|webp))['"]/gi;
const matches = new Set();
let match;
while ((match = rx.exec(content)) !== null) {
  matches.add(match[1]);
}

console.log(`Total unique texture paths found: ${matches.size}`);
console.log('\n--- ALL UNIQUE TEXTURES ---');
const sortedPaths = [...matches].sort();
sortedPaths.forEach(p => console.log(p));

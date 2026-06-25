import fs from 'fs';
import path from 'path';

const DOWNLOADS_DIR = 'C:/Users/Motar/Downloads';

function main() {
  const files = fs.readdirSync(DOWNLOADS_DIR);
  console.log('Searching for files in Downloads...');
  const matches = files.filter(f => f.includes('Photoroom') || f.includes('Transform') || f.includes('minotaur'));
  for (const m of matches) {
    const fullPath = path.join(DOWNLOADS_DIR, m);
    const stat = fs.statSync(fullPath);
    if (!stat.isDirectory()) {
      console.log(`- ${m} (${stat.size} bytes)`);
    }
  }
}

main();

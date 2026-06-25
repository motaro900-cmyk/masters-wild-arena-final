import fs from 'fs';
import path from 'path';

const SRC_DIR = 'assets-src/characters/';

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.webp') {
        console.log(`Source WebP found: ${fullPath} (${stat.size} bytes)`);
      }
    }
  }
}

try {
  console.log('Scanning assets-src/characters for WebP files...');
  scanDirectory(SRC_DIR);
  console.log('Scan complete.');
} catch (error) {
  console.error(error);
}

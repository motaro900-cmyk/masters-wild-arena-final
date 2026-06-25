import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = 'public/assets/';

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      if (stat.size === 0) {
        console.log(`[ALERT] 0-byte file found: ${fullPath}`);
      }
    }
  }
}

try {
  console.log('Scanning public/assets for 0-byte files...');
  scanDirectory(PUBLIC_DIR);
  console.log('Scan complete.');
} catch (error) {
  console.error(error);
}

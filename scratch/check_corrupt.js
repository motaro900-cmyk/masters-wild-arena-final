import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = 'public/assets/';

async function testImage(filePath) {
  try {
    await sharp(filePath).metadata();
  } catch (err) {
    console.log(`[CORRUPT] Failed to decode: ${filePath} - Error: ${err.message}`);
  }
}

async function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      await scanDirectory(fullPath);
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (['.webp', '.png', '.jpg', '.jpeg'].includes(ext)) {
        await testImage(fullPath);
      }
    }
  }
}

main();

async function main() {
  console.log('Testing all images in public/assets...');
  await scanDirectory(PUBLIC_DIR);
  console.log('Testing complete.');
}

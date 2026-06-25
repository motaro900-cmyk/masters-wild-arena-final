import sharp from 'sharp';
import fs from 'fs';

const pubPath = 'public/assets/images/ui/btn_panel_mis12c.webp';
const srcPath = 'assets-src/images/ui/btn_panel_mis12c.webp';

async function check(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File does not exist: ${filePath}`);
    return;
  }
  const stat = fs.statSync(filePath);
  console.log(`File: ${filePath} (${stat.size} bytes)`);
  try {
    const meta = await sharp(filePath).metadata();
    console.log(`  Valid image: ${meta.width}x${meta.height}, format: ${meta.format}`);
  } catch (err) {
    console.log(`  [ERROR] Invalid image: ${err.message}`);
  }
}

async function main() {
  await check(pubPath);
  await check(srcPath);
}

main();

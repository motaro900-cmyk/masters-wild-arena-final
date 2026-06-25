import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const assetsRoot = join(__dirname, '../public/assets');

const RULES = {
  'images/items/weapons': { w: 256, h: 256 },
  'images/items/helms': { w: 256, h: 256 },
};

function getFilesRecursively(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const name = join(dir, file);
    if (statSync(name).isDirectory()) {
      getFilesRecursively(name, fileList);
    } else {
      if (file.endsWith('.png') || file.endsWith('.webp')) {
        fileList.push(name);
      }
    }
  }
  return fileList;
}

async function audit() {
  console.log('=== STARTING EXTENDED SPRITE AUDIT ===\n');

  let totalErrors = 0;

  // 1. Audit weapons and helms
  for (const [folder, rule] of Object.entries(RULES)) {
    const folderPath = join(assetsRoot, folder);
    console.log(`📁 Auditing folder: assets/${folder} (expected: ${rule.w}x${rule.h})`);
    try {
      const files = readdirSync(folderPath).filter(f => f.endsWith('.png') || f.endsWith('.webp'));
      let errors = 0;
      for (const file of files) {
        const fullPath = join(folderPath, file);
        const metadata = await sharp(fullPath).metadata();
        if (metadata.width !== rule.w || metadata.height !== rule.h) {
          console.log(`  ❌ ${file}: ${metadata.width}x${metadata.height}`);
          errors++;
        }
      }
      console.log(`  Folder assets/${folder} finished: ${errors} errors found out of ${files.length} files.\n`);
      totalErrors += errors;
    } catch (e) {
      console.log(`  ⚠️ Folder empty or error: ${e.message}\n`);
    }
  }

  // 2. Audit characters recursively
  const charactersFolder = join(assetsRoot, 'characters');
  console.log(`📁 Auditing folder: assets/characters (recursively, expected: 512x512)`);
  try {
    const files = getFilesRecursively(charactersFolder);
    let errors = 0;
    for (const fullPath of files) {
      const relPath = fullPath.replace(charactersFolder, '').replace(/\\/g, '/');
      const metadata = await sharp(fullPath).metadata();
      if (metadata.width !== 512 || metadata.height !== 512) {
        console.log(`  ❌ ${relPath}: ${metadata.width}x${metadata.height}`);
        errors++;
      }
    }
    console.log(`  Folder assets/characters finished: ${errors} errors found out of ${files.length} files.\n`);
    totalErrors += errors;
  } catch (e) {
    console.log(`  ⚠️ characters folder error: ${e.message}\n`);
  }

  // 3. check_images.js check
  console.log('=== check_images.js Targets ===');
  const checkTargets = [
    'public/assets/images/frames/harvest_wheat_frame.webp',
    'public/assets/images/shop/bank_gold_small.webp',
    'public/assets/images/shop/bank_gold_medium.webp',
    'public/assets/images/shop/bank_gold_large.webp'
  ];
  for (const target of checkTargets) {
    try {
      const fullPath = join(__dirname, '../', target);
      const metadata = await sharp(fullPath).metadata();
      console.log(`  ℹ️ ${target}: ${metadata.format}, ${metadata.width}x${metadata.height}`);
    } catch (e) {
      console.log(`  ❌ Failed to read ${target}: ${e.message}`);
    }
  }

  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Total Errors found (excluding check_images targets): ${totalErrors}`);
}

audit();

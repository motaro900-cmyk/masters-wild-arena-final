import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp'; // Используем sharp вместо canvas для Node.js среды без GUI

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RULES = {
  'images/items/weapons': { w: 256, h: 256 },
  'images/items/helms': { w: 256, h: 256 },
  'characters':  { w: 512, h: 512 },
};

function getFilesRecursive(dir) {
  let results = [];
  try {
    const list = readdirSync(dir, { withFileTypes: true });
    for (const entry of list) {
      const res = join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(getFilesRecursive(res));
      } else if (entry.isFile()) {
        const nameLower = entry.name.toLowerCase();
        if (nameLower.endsWith('.png') || nameLower.endsWith('.webp')) {
          // Игнорируем атласы, спрайтшиты, базы персонажей и рамки
          const isSheetOrBase = nameLower.includes('sheet') || 
                                nameLower.includes('sprite') || 
                                nameLower.includes('poses') || 
                                nameLower.includes('base') || 
                                nameLower.includes('layout') ||
                                nameLower.includes('frame');
          if (!isSheetOrBase) {
            results.push(res);
          }
        }
      }
    }
  } catch (e) {
    // Ignore folder read errors
  }
  return results;
}

async function validateFolder(folderPath, rule) {
  try {
    const files = getFilesRecursive(folderPath);
    let errors = 0;
    
    for (const fullPath of files) {
      const relativePath = fullPath.replace(folderPath, '').replace(/^[\\\/]/, '');
      const metadata = await sharp(fullPath).metadata();
      
      if (metadata.width !== rule.w || metadata.height !== rule.h) {
        console.error(`❌ ${relativePath}: ${metadata.width}x${metadata.height} (нужно ${rule.w}x${rule.h})`);
        errors++;
      } else {
        console.log(`✅ ${relativePath}`);
      }
    }
    return errors;
  } catch (e) {
    console.warn(`⚠️ Ошибка при валидации папки: ${folderPath}`, e);
    return 0;
  }
}

async function run() {
  let totalErrors = 0;
  const assetsRoot = join(__dirname, '../public/assets');

  for (const [folder, rule] of Object.entries(RULES)) {
    console.log(`\n📁 Проверяю: assets/${folder}/`);
    totalErrors += await validateFolder(join(assetsRoot, folder), rule);
  }

  console.log('-----------------------------------');
  if (totalErrors === 0) {
    console.log('🎉 Все спрайты корректны!');
  } else {
    console.log(`\n💥 Найдено ошибок: ${totalErrors}`);
    process.exit(1);
  }
}

run();

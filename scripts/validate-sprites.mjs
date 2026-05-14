import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp'; // Используем sharp вместо canvas для Node.js среды без GUI

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RULES = {
  'weapons': { w: 256, h: 256 },
  'helmets': { w: 256, h: 256 },
  'characters':  { w: 512, h: 512 }, // В проекте папка называется characters
};

async function validateFolder(folderPath, rule) {
  try {
    const files = readdirSync(folderPath).filter(f => f.endsWith('.png'));
    let errors = 0;
    
    for (const file of files) {
      const fullPath = join(folderPath, file);
      const metadata = await sharp(fullPath).metadata();
      
      if (metadata.width !== rule.w || metadata.height !== rule.h) {
        console.error(`❌ ${file}: ${metadata.width}x${metadata.height} (нужно ${rule.w}x${rule.h})`);
        errors++;
      } else {
        console.log(`✅ ${file}`);
      }
    }
    return errors;
  } catch (e) {
    console.warn(`⚠️ Папка не найдена или пуста: ${folderPath}`);
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

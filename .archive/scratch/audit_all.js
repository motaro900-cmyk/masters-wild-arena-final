import fs from 'fs';
import path from 'path';

const SRC_DIR = 'assets-src/characters/';
const PUB_DIR = 'public/assets/characters/';

function auditFolder(baseDir) {
  const results = [];
  if (!fs.existsSync(baseDir)) return results;

  const folders = fs.readdirSync(baseDir);
  for (const folder of folders) {
    const folderPath = path.join(baseDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const ext = path.extname(file).toLowerCase();
      
      // Identify redundant files containing double extensions like _mobile_mobile.webp
      const isRedundant = file.includes('_mobile_mobile.webp') || file.includes('.webp_mobile.webp');
      
      // Also look for raw single frames if they shouldn't be in public
      // (For now, let's list all files in the folder so we can see what's there)
      results.push({
        character: folder,
        filename: file,
        path: filePath,
        size: fs.statSync(filePath).size,
        isRedundant
      });
    }
  }
  return results;
}

function main() {
  console.log('--- Character Folder Audit ---');
  const srcAudit = auditFolder(SRC_DIR);
  const pubAudit = auditFolder(PUB_DIR);

  console.log('\n--- Redundant Files Found in Source (assets-src) ---');
  const srcRedundant = srcAudit.filter(r => r.isRedundant);
  srcRedundant.forEach(r => console.log(`- [SRC] ${r.character}/${r.filename} (${r.size} bytes)`));
  if (srcRedundant.length === 0) console.log('None.');

  console.log('\n--- Redundant Files Found in Build (public/assets) ---');
  const pubRedundant = pubAudit.filter(r => r.isRedundant);
  pubRedundant.forEach(r => console.log(`- [PUB] ${r.character}/${r.filename} (${r.size} bytes)`));
  if (pubRedundant.length === 0) console.log('None.');
  
  console.log('\n--- Other files in Minotaur source/build ---');
  const minotaurFiles = [...srcAudit, ...pubAudit].filter(r => r.character === 'minotaur' && !r.isRedundant);
  minotaurFiles.forEach(r => console.log(`- [${r.path.startsWith('assets-src') ? 'SRC' : 'PUB'}] ${r.filename}`));
}

main();

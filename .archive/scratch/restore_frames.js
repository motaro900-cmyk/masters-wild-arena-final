import fs from 'fs';
import path from 'path';

const SRC_DIR = 'assets-src/characters/minotaur/';
const BACKUP_DIR = 'scratch/minotaur_frames/';

const filesToRestore = [
  'Transform_the_character_intoa_66071037-Photoroom-export.png',
  'Transform_the_character_into_a_2266071037-Photoroom-export.png',
  'Transform_the_character_into_a_266071037-Photoroom-export.png',
  'Transform_the_character_into_an_202606071037-Photoroom-export.png',
  'Transform_the_character_intoa_266071037-Photoroom-export.png',
  'Transform_the_character_into_an_22606071037-Photoroom-export.png',
  'Transform_the_character_into_an_2266071037-Photoroom-export.png'
];

function main() {
  for (const file of filesToRestore) {
    const backupPath = path.join(BACKUP_DIR, file);
    const srcPath = path.join(SRC_DIR, file);
    if (fs.existsSync(backupPath)) {
      fs.renameSync(backupPath, srcPath);
      console.log(`Restored frame to assets-src: ${file}`);
    }
  }
  console.log('Restoration completed.');
}

main();

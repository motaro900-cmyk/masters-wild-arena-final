import fs from 'fs';
import path from 'path';

const SRC_DIR = 'assets-src/characters/minotaur/';
const BACKUP_DIR = 'scratch/minotaur_frames/';
const PUBLIC_DIR = 'public/assets/characters/minotaur/';

const filesToClean = [
  'Transform_the_character_intoa_66071037-Photoroom-export.png',
  'Transform_the_character_into_a_2266071037-Photoroom-export.png',
  'Transform_the_character_into_a_266071037-Photoroom-export.png',
  'Transform_the_character_into_an_202606071037-Photoroom-export.png',
  'Transform_the_character_intoa_266071037-Photoroom-export.png',
  'Transform_the_character_into_an_22606071037-Photoroom-export.png',
  'Transform_the_character_into_an_2266071037-Photoroom-export.png'
];

function main() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Move files from src to backup
  for (const file of filesToClean) {
    const srcPath = path.join(SRC_DIR, file);
    const backupPath = path.join(BACKUP_DIR, file);
    if (fs.existsSync(srcPath)) {
      fs.renameSync(srcPath, backupPath);
      console.log(`Moved frame to backup: ${file}`);
    }
  }

  console.log('Cleanup completed in assets-src.');
}

main();

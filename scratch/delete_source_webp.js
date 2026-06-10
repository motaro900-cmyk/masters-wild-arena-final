import fs from 'fs';
import path from 'path';

const filesToDelete = [
  'assets-src/characters/ancients/ancient_golem.webp',
  'assets-src/characters/ancients/ancient_golem_mobile.webp',
  'assets-src/characters/ancients/ancient_griffin.webp',
  'assets-src/characters/ancients/ancient_griffin_mobile.webp',
  'assets-src/characters/ancients/ancient_panther.webp',
  'assets-src/characters/ancients/ancient_panther_mobile.webp',
  'assets-src/characters/ancients/ancient_spider.webp',
  'assets-src/characters/ancients/ancient_spider_mobile.webp',
  'assets-src/characters/ancients/ancient_treant.webp',
  'assets-src/characters/ancients/ancient_treant_mobile.webp',
  'assets-src/characters/ancients/ancient_wolf.webp',
  'assets-src/characters/ancients/ancient_wolf_mobile.webp',
  'assets-src/characters/panda/gemini-2026-05-30-002-Photoroom.webp',
  'assets-src/characters/panda/gemini-2026-05-30-002-Photoroom_mobile.webp',
  'assets-src/characters/panda/panda_base.webp',
  'assets-src/characters/panda/panda_base_mobile.webp',
  'assets-src/characters/panda/panda_frost.webp',
  'assets-src/characters/panda/panda_frost_mobile.webp',
  'assets-src/characters/panda/panda_frost_poses.webp',
  'assets-src/characters/panda/panda_frost_poses_mobile.webp',
  'assets-src/characters/panda/panda_poses.png.webp',
  'assets-src/characters/panda/panda_poses.png_mobile.webp',
  'assets-src/characters/panda/panda_poses_lossless.webp',
  'assets-src/characters/panda/panda_poses_lossless_mobile.webp',
  'assets-src/characters/raccoon/raccoon_base.webp',
  'assets-src/characters/raccoon/raccoon_base_mobile.webp',
  'assets-src/characters/raccoon/raccoon_poses.png.webp',
  'assets-src/characters/raccoon/raccoon_poses.png_mobile.webp'
];

function main() {
  console.log('Deleting redundant source WebP files...');
  let deletedCount = 0;
  for (const file of filesToDelete) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Deleted: ${file}`);
      deletedCount++;
    } else {
      console.log(`Not found (already cleaned): ${file}`);
    }
  }
  console.log(`Deleted ${deletedCount} files from assets-src.`);
}

main();

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ORIGINAL_GRID = 'C:/Users/Motar/.gemini/antigravity/brain/ccb229ee-9ac6-48e8-8e69-1d19f584eae7/media__1780818091809.png';
const USER_FILES_DIR = 'c:/Users/Motar/Desktop/Masters of the Wild/public/assets/characters/minotaur/';

const userFiles = [
  'Transform_the_character_into_a_2266071037-Photoroom-export.png',
  'Transform_the_character_into_a_266071037-Photoroom-export.png',
  'Transform_the_character_into_an_202606071037-Photoroom-export.png',
  'Transform_the_character_into_an_22606071037-Photoroom-export.png',
  'Transform_the_character_into_an_2266071037-Photoroom-export.png',
  'Transform_the_character_intoa_266071037-Photoroom-export.png',
  'Transform_the_character_intoa_66071037-Photoroom-export.png'
];

const CELL_W = 1024 / 3;
const CELL_H = 571 / 3;

const poseNames = {
  0: '0: Idle (2, 0)',
  1: '1: Defend (0, 1)',
  2: '2: Run (1, 2)',
  3: '3: Attack 1 (0, 0)',
  4: '4: Attack 2 (0, 2)',
  5: '5: Hit (1, 1)',
  6: '6: Attack 3 (1, 0)',
  7: '7: Death (2, 1)',
  8: '8: Empty (2, 2)'
};

const poseMapping = {
  0: [2, 0],
  1: [0, 1],
  2: [1, 2],
  3: [0, 0],
  4: [0, 2],
  5: [1, 1],
  6: [1, 0],
  7: [2, 1],
  8: [2, 2]
};

async function main() {
  const gridImg = sharp(ORIGINAL_GRID);
  const { data: gridData, info: gridInfo } = await gridImg.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  const poseBuffers = [];
  for (let f = 0; f < 9; f++) {
    const [row, col] = poseMapping[f];
    const left = Math.round(col * CELL_W);
    const top = Math.round(row * CELL_H);
    const w = Math.round(CELL_W);
    const h = Math.round(CELL_H);

    const cellBuffer = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const srcX = left + x;
        const srcY = top + y;
        if (srcX < gridInfo.width && srcY < gridInfo.height) {
          const srcIdx = (srcY * gridInfo.width + srcX) * 4;
          const destIdx = (y * w + x) * 4;
          cellBuffer[destIdx] = gridData[srcIdx];
          cellBuffer[destIdx + 1] = gridData[srcIdx + 1];
          cellBuffer[destIdx + 2] = gridData[srcIdx + 2];
          cellBuffer[destIdx + 3] = gridData[srcIdx + 3];
        }
      }
    }

    const resized = await sharp(cellBuffer, { raw: { width: w, height: h, channels: 4 } })
      .trim()
      .resize(32, 32, { fit: 'fill' })
      .raw()
      .toBuffer();
    poseBuffers.push(resized);
  }

  const userBuffers = [];
  for (const filename of userFiles) {
    const fullPath = path.join(USER_FILES_DIR, filename);
    const img = sharp(fullPath);
    const resized = await img
      .trim()
      .resize(32, 32, { fit: 'fill' })
      .raw()
      .toBuffer();
    userBuffers.push({ filename, data: resized });
  }

  console.log('Detailed comparison table (lower score = closer match):');
  for (const user of userBuffers) {
    console.log(`\nFile: ${user.filename}`);
    const scores = [];
    for (let f = 0; f < 9; f++) {
      const poseData = poseBuffers[f];
      let error = 0;
      for (let i = 0; i < 32 * 32; i++) {
        const rDiff = user.data[i * 4] - poseData[i * 4];
        const gDiff = user.data[i * 4 + 1] - poseData[i * 4 + 1];
        const bDiff = user.data[i * 4 + 2] - poseData[i * 4 + 2];
        error += rDiff * rDiff + gDiff * gDiff + bDiff * bDiff;
      }
      scores.push({ id: f, name: poseNames[f], score: error });
    }
    scores.sort((a, b) => a.score - b.score);
    for (let j = 0; j < 3; j++) {
      console.log(`  Top ${j+1}: ${scores[j].name} - score: ${scores[j].score}`);
    }
  }
}

main().catch(console.error);

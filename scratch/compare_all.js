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

// Mapping in game:
const actionNames = {
  0: 'Idle (стойка)',
  1: 'Defend (защита)',
  2: 'Run (бег)',
  3: 'Attack 1 (атака 1)',
  4: 'Attack 2 (атака 2)',
  5: 'Hit (получение урона)',
  6: 'Attack 3 (супер-атака)',
  7: 'Death (смерть)'
};

const poseMapping = {
  0: [2, 0], // Idle -> [row 2, col 0]
  1: [0, 1], // Defend -> [row 0, col 1]
  2: [1, 2], // Run -> [row 1, col 2]
  3: [0, 0], // Attack 1 -> [row 0, col 0]
  4: [0, 2], // Attack 2 -> [row 0, col 2]
  5: [1, 1], // Hit -> [row 1, col 1]
  6: [1, 0], // Attack 3 -> [row 1, col 0]
  7: [2, 1], // Death -> [row 2, col 1]
};

async function main() {
  // Load original grid
  const gridImg = sharp(ORIGINAL_GRID);
  const { data: gridData, info: gridInfo } = await gridImg.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  // Get cropped buffers for the 8 original poses
  const poseBuffers = [];
  for (let f = 0; f < 8; f++) {
    const [row, col] = poseMapping[f];
    const left = Math.round(col * CELL_W);
    const top = Math.round(row * CELL_H);
    const w = Math.round(CELL_W);
    const h = Math.round(CELL_H);

    // Extract raw pixels for this cell
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

    // Crop to bounding box and resize to 32x32 (RGB only)
    const resized = await sharp(cellBuffer, { raw: { width: w, height: h, channels: 4 } })
      .trim()
      .resize(32, 32, { fit: 'fill' })
      .raw()
      .toBuffer();
    poseBuffers.push(resized);
  }

  // Load and prepare the 7 user files
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

  // Compare each user file with each pose
  console.log('Comparing user files to game poses...');
  const results = [];

  for (const user of userBuffers) {
    let bestPose = -1;
    let minError = Infinity;

    for (let f = 0; f < 8; f++) {
      const poseData = poseBuffers[f];
      let error = 0;
      
      // Calculate Mean Squared Error of RGB channels
      for (let i = 0; i < 32 * 32; i++) {
        const rDiff = user.data[i * 4] - poseData[i * 4];
        const gDiff = user.data[i * 4 + 1] - poseData[i * 4 + 1];
        const bDiff = user.data[i * 4 + 2] - poseData[i * 4 + 2];
        error += rDiff * rDiff + gDiff * gDiff + bDiff * bDiff;
      }

      if (error < minError) {
        minError = error;
        bestPose = f;
      }
    }

    results.push({
      filename: user.filename,
      poseId: bestPose,
      poseName: actionNames[bestPose],
      error: minError
    });
  }

  // Print mapping
  console.log('\nResults mapping:');
  for (const res of results) {
    console.log(`- ${res.filename} => Frame ${res.poseId}: ${res.poseName} (error: ${res.error})`);
  }

  // Check which pose is missing
  const mappedPoses = results.map(r => r.poseId);
  const missingPoses = [];
  for (let f = 0; f < 8; f++) {
    if (!mappedPoses.includes(f)) {
      missingPoses.push(f);
    }
  }

  console.log('\nMissing game poses:');
  for (const m of missingPoses) {
    console.log(`- Frame ${m}: ${actionNames[m]}`);
  }
}

main().catch(console.error);

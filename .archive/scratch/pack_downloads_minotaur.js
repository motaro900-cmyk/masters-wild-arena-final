import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const DOWNLOADS_DIR = 'C:/Users/Motar/Downloads';
const DEST_DIR = 'assets-src/characters/minotaur/';
const FRAME_SIZE = 512;

const filesMap = [
  '0_idle.png',
  '1_defend.png',
  '2_run.png',
  '3_attack1.png',
  '4_attack2.png',
  '5_hit.png',
  '6_attack3.png',
  '7_death.png'
];

async function packMinotaur() {
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  const frames = [];

  for (let f = 0; f < 8; f++) {
    const filename = filesMap[f];
    const srcPath = path.join(DOWNLOADS_DIR, filename);
    console.log(`Processing frame ${f}: ${srcPath}`);

    if (!fs.existsSync(srcPath)) {
      throw new Error(`File not found: ${srcPath}`);
    }

    const img = sharp(srcPath);
    const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    
    // Find bounding box
    let minX = info.width;
    let maxX = 0;
    let minY = info.height;
    let maxY = 0;
    let hasPixels = false;

    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasPixels = true;
        }
      }
    }

    const frameBuffer = Buffer.alloc(FRAME_SIZE * FRAME_SIZE * 4, 0); // Transparent 512x512

    if (hasPixels) {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const srcIdx = (y * info.width + x) * 4;

          // Align center to 256, bottom to 486
          const targetX = Math.round(x - (minX + maxX) / 2 + 256);
          const targetY = y - maxY + 486;

          if (targetX >= 0 && targetX < FRAME_SIZE && targetY >= 0 && targetY < FRAME_SIZE) {
            const destIdx = (targetY * FRAME_SIZE + targetX) * 4;
            frameBuffer[destIdx] = data[srcIdx];
            frameBuffer[destIdx + 1] = data[srcIdx + 1];
            frameBuffer[destIdx + 2] = data[srcIdx + 2];
            frameBuffer[destIdx + 3] = data[srcIdx + 3];
          }
        }
      }
      console.log(`  Frame ${f} processed. Box: x=${minX}..${maxX}, y=${minY}..${maxY}`);
    } else {
      console.warn(`  Warning: Frame ${f} is completely empty!`);
    }

    frames.push(frameBuffer);
  }

  // Pack into a 2048x1024 spritesheet (4x2 layout)
  const sheetW = 2048;
  const sheetH = 1024;
  const sheetBuffer = Buffer.alloc(sheetW * sheetH * 4, 0);

  for (let f = 0; f < 8; f++) {
    const rf = Math.floor(f / 4);
    const cf = f % 4;
    const sheetLeft = cf * FRAME_SIZE;
    const sheetTop = rf * FRAME_SIZE;
    const frameBuffer = frames[f];

    for (let y = 0; y < FRAME_SIZE; y++) {
      for (let x = 0; x < FRAME_SIZE; x++) {
        const srcIdx = (y * FRAME_SIZE + x) * 4;
        const destX = sheetLeft + x;
        const destY = sheetTop + y;
        const destIdx = (destY * sheetW + destX) * 4;

        sheetBuffer[destIdx] = frameBuffer[srcIdx];
        sheetBuffer[destIdx + 1] = frameBuffer[srcIdx + 1];
        sheetBuffer[destIdx + 2] = frameBuffer[srcIdx + 2];
        sheetBuffer[destIdx + 3] = frameBuffer[srcIdx + 3];
      }
    }
  }

  const sheetPath = path.join(DEST_DIR, 'minotaur_poses.png.png');
  await sharp(sheetBuffer, { raw: { width: sheetW, height: sheetH, channels: 4 } })
    .png()
    .toFile(sheetPath);
  console.log(`Saved spritesheet: ${sheetPath}`);

  // Save base frame (idle frame 0)
  const basePath = path.join(DEST_DIR, 'minotaur_base.png');
  await sharp(frames[0], { raw: { width: FRAME_SIZE, height: FRAME_SIZE, channels: 4 } })
    .png()
    .toFile(basePath);
  console.log(`Saved base idle frame: ${basePath}`);

  // Create JSON metadata
  const poseNames = [
    '0_idle.png',
    '1_defend.png',
    '2_run.png',
    '3_attack1.png',
    '4_attack2.png',
    '5_hit.png',
    '6_attack3.png',
    '7_death.png'
  ];

  const jsonMetadata = {
    frames: {},
    meta: {
      image: 'minotaur_poses.png.png',
      size: { w: sheetW, h: sheetH }
    }
  };

  for (let f = 0; f < 8; f++) {
    const rf = Math.floor(f / 4);
    const cf = f % 4;
    const x = cf * FRAME_SIZE;
    const y = rf * FRAME_SIZE;

    jsonMetadata.frames[poseNames[f]] = {
      frame: { x, y, w: FRAME_SIZE, h: FRAME_SIZE },
      spriteSourceSize: { x: 0, y: 0, w: FRAME_SIZE, h: FRAME_SIZE },
      sourceSize: { w: FRAME_SIZE, h: FRAME_SIZE },
      pivot: { x: 0.5, y: 0.95 }
    };
  }

  const jsonPath = path.join(DEST_DIR, 'minotaur_poses.png.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonMetadata, null, 2), 'utf8');
  console.log(`Saved JSON: ${jsonPath}`);
}

packMinotaur()
  .then(() => console.log('Successfully completed packing!'))
  .catch(console.error);

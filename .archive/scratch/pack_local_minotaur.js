import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = 'public/assets/characters/minotaur/';
const SRC_DIR = 'assets-src/characters/minotaur/';
const FRAME_SIZE = 512;

const filesMap = [
  'Transform_the_character_intoa_66071037-Photoroom-export.png', // Frame 0: Idle
  'Transform_the_character_into_a_2266071037-Photoroom-export.png', // Frame 1: Defend
  'Transform_the_character_into_a_266071037-Photoroom-export.png', // Frame 2: Run
  'Transform_the_character_into_an_202606071037-Photoroom-export.png', // Frame 3: Attack 1
  'Transform_the_character_intoa_266071037-Photoroom-export.png', // Frame 4: Attack 2
  'Transform_the_character_into_an_22606071037-Photoroom-export.png', // Frame 5: Hit
  'Transform_the_character_into_an_2266071037-Photoroom-export.png', // Frame 6: Attack 3
  'Transform_the_character_into_an_2266071037-Photoroom-export.png'  // Frame 7: Death (duplicated)
];

async function main() {
  // 1. Ensure assets-src directory exists
  if (!fs.existsSync(SRC_DIR)) {
    fs.mkdirSync(SRC_DIR, { recursive: true });
  }

  // 2. Move files from public/ to assets-src/ to keep sources clean
  console.log('Moving source frames to assets-src...');
  const uniqueFiles = [...new Set(filesMap)];
  for (const file of uniqueFiles) {
    const pubPath = path.join(PUBLIC_DIR, file);
    const srcPath = path.join(SRC_DIR, file);
    if (fs.existsSync(pubPath)) {
      fs.renameSync(pubPath, srcPath);
      console.log(`Moved: ${file} -> assets-src`);
    } else if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing frame file: ${file} in both public and assets-src!`);
    }
  }

  // 3. Process each frame (align X center and Y feet)
  const frames = [];
  for (let f = 0; f < 8; f++) {
    const filename = filesMap[f];
    const srcPath = path.join(SRC_DIR, filename);
    console.log(`Processing frame ${f}: ${filename}`);

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

    const frameBuffer = Buffer.alloc(FRAME_SIZE * FRAME_SIZE * 4, 0);

    if (hasPixels) {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const srcIdx = (y * info.width + x) * 4;

          // Align center to 256, feet (bottom) to 486
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

  // 4. Combine into a 2048x1024 spritesheet (4x2 layout)
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

  const sheetPath = path.join(SRC_DIR, 'minotaur_poses.png.png');
  await sharp(sheetBuffer, { raw: { width: sheetW, height: sheetH, channels: 4 } })
    .png()
    .toFile(sheetPath);
  console.log(`Saved spritesheet: ${sheetPath}`);

  // Save base frame (idle frame 0)
  const basePath = path.join(SRC_DIR, 'minotaur_base.png');
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

  const jsonPath = path.join(SRC_DIR, 'minotaur_poses.png.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonMetadata, null, 2), 'utf8');
  console.log(`Saved JSON: ${jsonPath}`);
}

main()
  .then(() => console.log('Successfully completed packing!'))
  .catch(console.error);

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Define the source images
const characters = [
  {
    id: 'minotaur',
    sourcePath: 'C:/Users/Motar/.gemini/antigravity/brain/ccb229ee-9ac6-48e8-8e69-1d19f584eae7/media__1780818091809.png',
    destDir: 'assets-src/characters/minotaur/',
    mapping: {
      0: [2, 0], // Idle -> [row 2, col 0]
      1: [0, 1], // Defend -> [row 0, col 1]
      2: [1, 2], // Run -> [row 1, col 2]
      3: [0, 0], // Attack 1 -> [row 0, col 0]
      4: [0, 2], // Attack 2 -> [row 0, col 2]
      5: [1, 1], // Hit -> [row 1, col 1]
      6: [1, 0], // Attack 3 -> [row 1, col 0]
      7: [2, 1], // Death -> [row 2, col 1]
    }
  },
  {
    id: 'tiger_warrior',
    sourcePath: 'C:/Users/Motar/.gemini/antigravity/brain/ccb229ee-9ac6-48e8-8e69-1d19f584eae7/media__1780818091817.png',
    destDir: 'assets-src/characters/tiger_warrior/',
    mapping: {
      0: [2, 0], // Idle -> [row 2, col 0]
      1: [0, 1], // Defend -> [row 0, col 1]
      2: [1, 2], // Run -> [row 1, col 2]
      3: [0, 0], // Attack 1 -> [row 0, col 0]
      4: [1, 0], // Attack 2 -> [row 1, col 0]
      5: [2, 2], // Hit -> [row 2, col 2]
      6: [2, 1], // Attack 3 -> [row 2, col 1]
      7: [1, 1], // Death -> [row 1, col 1]
    }
  },
  {
    id: 'lion_knight',
    sourcePath: 'C:/Users/Motar/.gemini/antigravity/brain/ccb229ee-9ac6-48e8-8e69-1d19f584eae7/media__1780818093241.png',
    destDir: 'assets-src/characters/lion_knight/',
    mapping: {
      0: [2, 0], // Idle -> [row 2, col 0]
      1: [0, 1], // Defend -> [row 0, col 1]
      2: [1, 2], // Run -> [row 1, col 2]
      3: [0, 0], // Attack 1 -> [row 0, col 0]
      4: [1, 0], // Attack 2 -> [row 1, col 0]
      5: [2, 2], // Hit -> [row 2, col 2]
      6: [2, 1], // Attack 3 -> [row 2, col 1]
      7: [1, 1], // Death -> [row 1, col 1]
    }
  }
];

const CELL_W = 1024 / 3;
const CELL_H = 571 / 3;
const FRAME_SIZE = 512;

async function processCharacters() {
  for (const char of characters) {
    console.log(`\n==========================================`);
    console.log(`Processing character: ${char.id}`);
    console.log(`Source image: ${char.sourcePath}`);
    console.log(`Destination dir: ${char.destDir}`);

    // 1. Create target directory
    if (!fs.existsSync(char.destDir)) {
      fs.mkdirSync(char.destDir, { recursive: true });
      console.log(`Created directory: ${char.destDir}`);
    }

    // Load source image
    const img = sharp(char.sourcePath);
    const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    
    // We will hold the 8 aligned frames
    const frames = [];

    // Process each frame 0 to 7
    for (let f = 0; f < 8; f++) {
      const [row, col] = char.mapping[f];
      
      // Calculate cell boundaries (integers for pixel indexing)
      const left = Math.round(col * CELL_W);
      const top = Math.round(row * CELL_H);
      const right = Math.round((col + 1) * CELL_W);
      const bottom = Math.round((row + 1) * CELL_H);
      const w = right - left;
      const h = bottom - top;

      // Identify bounding box of non-transparent pixels (alpha > 0)
      let minX = w;
      let maxX = 0;
      let minY = h;
      let maxY = 0;
      let hasPixels = false;

      for (let y = 0; y < h; y++) {
        const globalY = top + y;
        if (globalY >= info.height) continue;
        for (let x = 0; x < w; x++) {
          const globalX = left + x;
          if (globalX >= info.width) continue;

          const idx = (globalY * info.width + globalX) * 4;
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
        // Copy cropped content to 512x512 canvas, aligning center to 256, feet (bottom) to 486
        for (let y = minY; y <= maxY; y++) {
          const globalY = top + y;
          if (globalY >= info.height) continue;
          
          for (let x = minX; x <= maxX; x++) {
            const globalX = left + x;
            if (globalX >= info.width) continue;

            const srcIdx = (globalY * info.width + globalX) * 4;

            // Target alignment calculations:
            // Horizontal center: ((minX + maxX) / 2) aligns with 256
            const targetX = Math.round(x - (minX + maxX) / 2 + 256);
            // Bottom edge: maxY aligns with 486
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
        console.log(`  Frame ${f} (Cell [row=${row}, col=${col}]): BBox relative to cell x=${minX}..${maxX}, y=${minY}..${maxY}. Aligned.`);
      } else {
        console.log(`  Warning: Frame ${f} (Cell [row=${row}, col=${col}]) is EMPTY.`);
      }

      frames.push(frameBuffer);
    }

    // 6. Combine the 8 frames into a 2048x1024 spritesheet (4x2 grid of 512x512 frames)
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

    // 7. Save spritesheet as [id]_poses.png.png
    const sheetPath = path.join(char.destDir, `${char.id}_poses.png.png`);
    await sharp(sheetBuffer, { raw: { width: sheetW, height: sheetH, channels: 4 } })
      .png()
      .toFile(sheetPath);
    console.log(`  Saved spritesheet: ${sheetPath}`);

    // 8. Create PIXI spritesheet JSON metadata at [id]_poses.png.json
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
        image: `${char.id}_poses.png.png`,
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

    const jsonPath = path.join(char.destDir, `${char.id}_poses.png.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonMetadata, null, 2), 'utf8');
    console.log(`  Saved JSON metadata: ${jsonPath}`);

    // 9. Save frame 0 (Idle) as [id]_base.png
    const basePath = path.join(char.destDir, `${char.id}_base.png`);
    await sharp(frames[0], { raw: { width: FRAME_SIZE, height: FRAME_SIZE, channels: 4 } })
      .png()
      .toFile(basePath);
    console.log(`  Saved base idle frame: ${basePath}`);
  }
}

processCharacters()
  .then(() => console.log('\nAll character processing completed successfully!'))
  .catch(console.error);

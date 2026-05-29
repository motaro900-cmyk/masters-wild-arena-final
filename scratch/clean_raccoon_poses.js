import sharp from 'sharp';
import fs from 'fs';

async function cleanImage(imgPath, destPath, cols, rows) {
  console.log(`\nCleaning image: ${imgPath} -> ${destPath}`);
  const { data, info } = await sharp(imgPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  const frameW = width / cols;
  const frameH = height / rows;

  const outBuffer = Buffer.from(data);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const frameLeft = c * frameW;
      const frameTop = r * frameH;

      const visited = new Uint8Array(frameW * frameH);
      const components = [];

      const isActive = (x, y) => {
        if (x < 0 || x >= frameW || y < 0 || y >= frameH) return false;
        const srcX = frameLeft + x;
        const srcY = frameTop + y;
        const idx = (srcY * width + srcX) * channels;
        const rVal = data[idx];
        const gVal = data[idx + 1];
        const bVal = data[idx + 2];
        const aVal = channels === 4 ? data[idx + 3] : 255;
        const isBg = rVal < 35 && gVal < 35 && bVal < 35;
        return !isBg && aVal > 30;
      };

      for (let y = 0; y < frameH; y++) {
        for (let x = 0; x < frameW; x++) {
          const pos = y * frameW + x;
          if (visited[pos] || !isActive(x, y)) continue;

          const queue = [[x, y]];
          visited[pos] = 1;
          let minX = x, maxX = x, minY = y, maxY = y;
          let pixelCount = 0;
          const coords = [];

          while (queue.length > 0) {
            const [cx, cy] = queue.shift();
            pixelCount++;
            coords.push([cx, cy]);

            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;

            const neighbors = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1]
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < frameW && ny >= 0 && ny < frameH) {
                const npos = ny * frameW + nx;
                if (!visited[npos] && isActive(nx, ny)) {
                  visited[npos] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
          }

          if (pixelCount > 50) {
            components.push({ minX, maxX, minY, maxY, pixelCount, coords });
          }
        }
      }

      if (components.length <= 1) continue;

      components.sort((a, b) => b.pixelCount - a.pixelCount);
      
      for (let i = 1; i < components.length; i++) {
        const comp = components[i];
        const centerX = (comp.minX + comp.maxX) / 2;
        const centerY = (comp.minY + comp.maxY) / 2;

        // Strict cleanup rules for floating sword and top-left text artifacts:
        const shouldErase = 
          (centerX > 540 && comp.minX > 500 && centerY > 450) || // Floating sword bottom-right
          (centerX < 180 && centerY < 300); // Top-left floating artifacts (text)

        if (shouldErase) {
          console.log(`  Erasing Frame [${r}, ${c}] Comp ${i}: pixels=${comp.pixelCount}, bounds=[X: ${comp.minX}..${comp.maxX}, Y: ${comp.minY}..${comp.maxY}], center=(${centerX}, ${centerY})`);
          
          comp.coords.forEach(([cx, cy]) => {
            const srcX = frameLeft + cx;
            const srcY = frameTop + cy;
            const idx = (srcY * width + srcX) * 4;
            outBuffer[idx] = 0;
            outBuffer[idx + 1] = 0;
            outBuffer[idx + 2] = 0;
            outBuffer[idx + 3] = 0; // Fully transparent
          });
        }
      }
    }
  }

  // Overwrite file
  await sharp(outBuffer, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png()
  .toFile(destPath);
  console.log(`Finished cleaning ${destPath}`);
}

async function run() {
  // Clean poses spritesheet
  await cleanImage(
    'public/assets/characters/raccoon/raccoon_poses.png',
    'public/assets/characters/raccoon/raccoon_poses.png',
    4,
    2
  );

  // Clean base/idle image
  await cleanImage(
    'public/assets/characters/raccoon/raccoon_base.png',
    'public/assets/characters/raccoon/raccoon_base.png',
    1,
    1
  );
}

run().catch(console.error);

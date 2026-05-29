import sharp from 'sharp';
import fs from 'fs';

async function run() {
  const imgPath = 'public/assets/characters/raccoon/raccoon_poses.png';
  const { data, info } = await sharp(imgPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  const cols = 4;
  const rows = 2;
  const frameW = width / cols;
  const frameH = height / rows;

  console.log(`Image size: ${width}x${height}. Slicing into ${cols}x${rows} of size ${frameW}x${frameH}`);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      console.log(`\n--- Frame [Row ${r}, Col ${c}] ---`);
      
      const frameLeft = c * frameW;
      const frameTop = r * frameH;

      // Extract frame pixels
      const frameData = Buffer.alloc(frameW * frameH * 4);
      for (let y = 0; y < frameH; y++) {
        for (let x = 0; x < frameW; x++) {
          const srcX = frameLeft + x;
          const srcY = frameTop + y;
          const srcIdx = (srcY * width + srcX) * channels;
          const destIdx = (y * frameW + x) * 4;

          frameData[destIdx] = data[srcIdx];
          frameData[destIdx + 1] = data[srcIdx + 1];
          frameData[destIdx + 2] = data[srcIdx + 2];
          frameData[destIdx + 3] = channels === 4 ? data[srcIdx + 3] : 255;
        }
      }

      // BFS to find components in this frame
      const visited = new Uint8Array(frameW * frameH);
      const components = [];

      const isActive = (x, y) => {
        if (x < 0 || x >= frameW || y < 0 || y >= frameH) return false;
        const idx = (y * frameW + x) * 4;
        const rVal = frameData[idx];
        const gVal = frameData[idx + 1];
        const bVal = frameData[idx + 2];
        const aVal = frameData[idx + 3];
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

          while (queue.length > 0) {
            const [cx, cy] = queue.shift();
            pixelCount++;

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
            components.push({ minX, maxX, minY, maxY, pixelCount, startX: x, startY: y });
          }
        }
      }

      components.sort((a, b) => b.pixelCount - a.pixelCount);
      components.forEach((comp, idx) => {
        console.log(`  Comp ${idx}: pixels=${comp.pixelCount}, bounds=[X: ${comp.minX}..${comp.maxX}, Y: ${comp.minY}..${comp.maxY}]`);
      });
    }
  }
}

run().catch(console.error);

import sharp from 'sharp';

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

  let svg = `<svg width="${width}" height="${height}">`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const frameLeft = c * frameW;
      const frameTop = r * frameH;

      // BFS to find components
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
            components.push({ minX, maxX, minY, maxY, pixelCount });
          }
        }
      }

      components.sort((a, b) => b.pixelCount - a.pixelCount);
      components.forEach((comp, idx) => {
        const absMinX = frameLeft + comp.minX;
        const absMaxX = frameLeft + comp.maxX;
        const absMinY = frameTop + comp.minY;
        const absMaxY = frameTop + comp.maxY;

        const color = idx === 0 ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.8)';
        svg += `<rect x="${absMinX}" y="${absMinY}" width="${absMaxX - absMinX}" height="${absMaxY - absMinY}" fill="none" stroke="${color}" stroke-width="3"/>`;
        svg += `<text x="${absMinX}" y="${absMinY - 5}" fill="${idx === 0 ? 'green' : 'red'}" font-size="14" font-weight="bold">F${r}${c} C${idx} (${comp.pixelCount}px)</text>`;
      });

      // Draw cell grid
      svg += `<rect x="${frameLeft}" y="${frameTop}" width="${frameW}" height="${frameH}" fill="none" stroke="blue" stroke-width="1" stroke-dasharray="5,5"/>`;
    }
  }

  svg += `</svg>`;

  await sharp(imgPath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toFile('scratch/raccoon_components_debug.png');

  console.log('Saved debug image to scratch/raccoon_components_debug.png');
}

run().catch(console.error);

import sharp from 'sharp';

async function run() {
  const { data, info } = await sharp('scratch/raccoon_debug/row0_col0.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  // Let's find connected components of active pixels.
  // We can use a simple BFS/DFS algorithm.
  const visited = new Uint8Array(width * height);
  const components = [];

  const isActive = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * channels;
    const a = channels === 4 ? data[idx + 3] : 255;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const isBg = r < 35 && g < 35 && b < 35;
    return !isBg && a > 30;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      if (visited[pos] || !isActive(x, y)) continue;

      // Start BFS
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

        // Check 4 neighbors
        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const npos = ny * width + nx;
            if (!visited[npos] && isActive(nx, ny)) {
              visited[npos] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }

      if (pixelCount > 100) { // Filter out noise
        components.push({ minX, maxX, minY, maxY, pixelCount });
      }
    }
  }

  console.log(`Found ${components.length} pixel components in row0_col0.png:`);
  components.forEach((c, idx) => {
    console.log(`Component ${idx}:`);
    console.log(`  X: ${c.minX} to ${c.maxX} (width: ${c.maxX - c.minX})`);
    console.log(`  Y: ${c.minY} to ${c.maxY} (height: ${c.maxY - c.minY})`);
    console.log(`  Pixels: ${c.pixelCount}`);
  });
}

run().catch(console.error);

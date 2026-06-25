import sharp from 'sharp';

const imagePath = './public/assets/characters/panda/gemini-2026-05-30-002-Photoroom.png';

async function run() {
  try {
    const { data, info } = await sharp(imagePath)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;

    // Downscale factor to speed up BFS/clustering
    const scale = 8;
    const dsW = Math.floor(width / scale);
    const dsH = Math.floor(height / scale);

    // Create a 2D grid of alphas
    const grid = [];
    for (let y = 0; y < dsH; y++) {
      grid[y] = new Uint8Array(dsW);
      for (let x = 0; x < dsW; x++) {
        // Sample corresponding area
        let maxAlpha = 0;
        const origYStart = y * scale;
        const origYEnd = Math.min((y + 1) * scale, height);
        const origXStart = x * scale;
        const origXEnd = Math.min((x + 1) * scale, width);

        for (let oy = origYStart; oy < origYEnd; oy++) {
          for (let ox = origXStart; ox < origXEnd; ox++) {
            const idx = (oy * width + ox) * channels;
            if (data[idx + 3] > maxAlpha) {
              maxAlpha = data[idx + 3];
            }
          }
        }
        grid[y][x] = maxAlpha > 15 ? 1 : 0; // threshold
      }
    }

    // Flood fill to find connected components
    const visited = [];
    for (let y = 0; y < dsH; y++) visited[y] = new Uint8Array(dsW);

    const components = [];

    for (let y = 0; y < dsH; y++) {
      for (let x = 0; x < dsW; x++) {
        if (grid[y][x] === 1 && !visited[y][x]) {
          // Start a new component
          const comp = {
            minX: x, maxX: x,
            minY: y, maxY: y,
            pixels: []
          };

          const queue = [[x, y]];
          visited[y][x] = 1;

          while (queue.length > 0) {
            const [cx, cy] = queue.shift();
            comp.pixels.push([cx, cy]);
            if (cx < comp.minX) comp.minX = cx;
            if (cx > comp.maxX) comp.maxX = cx;
            if (cy < comp.minY) comp.minY = cy;
            if (cy > comp.maxY) comp.maxY = cy;

            // Neighbors
            const neighbors = [
              [cx + 1, cy], [cx - 1, cy],
              [cx, cy + 1], [cx, cy - 1],
              [cx + 1, cy + 1], [cx - 1, cy - 1],
              [cx + 1, cy - 1], [cx - 1, cy + 1]
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < dsW && ny >= 0 && ny < dsH) {
                if (grid[ny][nx] === 1 && !visited[ny][nx]) {
                  visited[ny][nx] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
          }

          // Convert back to original scale
          comp.origMinX = comp.minX * scale;
          comp.origMaxX = Math.min((comp.maxX + 1) * scale, width);
          comp.origMinY = comp.minY * scale;
          comp.origMaxY = Math.min((comp.maxY + 1) * scale, height);
          comp.origW = comp.origMaxX - comp.origMinX;
          comp.origH = comp.origMaxY - comp.origMinY;

          // Only keep components with a decent size (ignore small noise)
          if (comp.origW > 50 && comp.origH > 50) {
            components.push(comp);
          }
        }
      }
    }

    console.log(`Found ${components.length} large components:`);
    components.forEach((c, idx) => {
      console.log(`Sprite ${idx + 1}: x: ${c.origMinX}, y: ${c.origMinY}, w: ${c.origW}, h: ${c.origH}`);
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

run();

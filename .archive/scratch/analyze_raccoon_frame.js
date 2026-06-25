import sharp from 'sharp';

async function run() {
  const { data, info } = await sharp('scratch/raccoon_debug/row0_col0.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  // Let's find separate disconnected segments of pixels in this 800x700 frame.
  // We can do a simple column and row profile of active pixels.
  let rowProfile = new Array(height).fill(0);
  let colProfile = new Array(width).fill(0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const a = channels === 4 ? data[idx + 3] : 255;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const isBg = r < 35 && g < 35 && b < 35;
      if (!isBg && a > 30) {
        rowProfile[y]++;
        colProfile[x]++;
      }
    }
  }

  // Print non-zero ranges
  console.log('Row profile active ranges:');
  let inRange = false;
  let startY = 0;
  for (let y = 0; y < height; y++) {
    const active = rowProfile[y] > 2;
    if (active && !inRange) {
      startY = y;
      inRange = true;
    } else if (!active && inRange) {
      console.log(`  Y: ${startY} to ${y - 1} (height: ${y - startY})`);
      inRange = false;
    }
  }
  if (inRange) {
    console.log(`  Y: ${startY} to ${height - 1} (height: ${height - startY})`);
  }

  console.log('Col profile active ranges:');
  inRange = false;
  let startX = 0;
  for (let x = 0; x < width; x++) {
    const active = colProfile[x] > 2;
    if (active && !inRange) {
      startX = x;
      inRange = true;
    } else if (!active && inRange) {
      console.log(`  X: ${startX} to ${x - 1} (width: ${x - startX})`);
      inRange = false;
    }
  }
  if (inRange) {
    console.log(`  X: ${startX} to ${width - 1} (width: ${width - startX})`);
  }
}

run().catch(console.error);

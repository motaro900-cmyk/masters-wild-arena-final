import sharp from 'sharp';

async function run() {
  const imgPath = 'public/assets/characters/raccoon/raccoon_poses.png';
  const { data, info } = await sharp(imgPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels; // 3 or 4

  console.log(`Image: ${width}x${height}, channels: ${channels}`);

  // Let's divide the image into 2 horizontal rows.
  const rowHeight = Math.floor(height / 2);

  for (let row = 0; row < 2; row++) {
    const startY = row * rowHeight;
    const endY = (row + 1) * rowHeight;
    console.log(`\n--- Row ${row} (Y: ${startY} to ${endY}) ---`);

    // Let's calculate the non-background pixels in columns
    const colActivity = new Array(width).fill(0);
    for (let x = 0; x < width; x++) {
      let activePixels = 0;
      for (let y = startY; y < endY; y++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = channels === 4 ? data[idx + 3] : 255;

        // If it's not very dark and not transparent, count as active
        // Let's check if the background is dark (R, G, B < 40)
        const isBg = r < 35 && g < 35 && b < 35;
        if (!isBg && a > 30) {
          activePixels++;
        }
      }
      colActivity[x] = activePixels;
    }

    // Print active segments (where activity > 5 pixels)
    let inSegment = false;
    let startX = 0;
    const segments = [];
    for (let x = 0; x < width; x++) {
      const isActive = colActivity[x] > 3;
      if (isActive && !inSegment) {
        startX = x;
        inSegment = true;
      } else if (!isActive && inSegment) {
        segments.push({ start: startX, end: x - 1 });
        inSegment = false;
      }
    }
    if (inSegment) {
      segments.push({ start: startX, end: width - 1 });
    }

    console.log(`Active segments in Row ${row}:`, segments);
    segments.forEach((seg, idx) => {
      console.log(`  Seg ${idx}: center = ${(seg.start + seg.end) / 2}, width = ${seg.end - seg.start}`);
    });
  }
}

run().catch(console.error);

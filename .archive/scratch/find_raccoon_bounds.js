import sharp from 'sharp';

async function run() {
  const imgPath = 'public/assets/characters/raccoon/raccoon_poses.png';
  const { data, info } = await sharp(imgPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  const rowHeight = Math.floor(height / 2);

  // We want to find 4 frames in Row 0 and 4 frames in Row 1.
  // Let's print out the column activity profile to find the valleys (gaps) between characters.
  for (let row = 0; row < 2; row++) {
    const startY = row * rowHeight;
    const endY = (row + 1) * rowHeight;
    const colActivity = new Array(width).fill(0);

    for (let x = 0; x < width; x++) {
      for (let y = startY; y < endY; y++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = channels === 4 ? data[idx + 3] : 255;
        const isBg = r < 35 && g < 35 && b < 35;
        if (!isBg && a > 30) {
          colActivity[x]++;
        }
      }
    }

    console.log(`\nRow ${row} activity profile:`);
    // Find local minima (valleys) around expected boundaries (600, 1200, 1800)
    // We search in a window of +/- 150 pixels around 600, 1200, 1800
    const boundaries = [600, 1200, 1800];
    const actualCuts = [0];
    for (const b of boundaries) {
      let minVal = Infinity;
      let minX = b;
      for (let x = b - 150; x <= b + 150; x++) {
        if (x < 0 || x >= width) continue;
        if (colActivity[x] < minVal) {
          minVal = colActivity[x];
          minX = x;
        }
      }
      actualCuts.push(minX);
      console.log(`  Target boundary ${b}: optimal cut at X = ${minX} (activity = ${minVal})`);
    }
    actualCuts.push(width);
    console.log(`  Final cuts for Row ${row}:`, actualCuts);
  }
}

run().catch(console.error);

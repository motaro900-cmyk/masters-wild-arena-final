import sharp from 'sharp';

async function run() {
  const imgPath = 'public/assets/characters/raccoon/raccoon_poses.png';
  const { data, info } = await sharp(imgPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const cols = 8;
  const rows = 3;
  const cellW = w / cols; // 128
  const cellH = h / rows; // 190.33
  const channels = info.channels;

  console.log(`Checking 8x3 grid (cell size ${cellW}x${cellH}):`);

  for (let r = 0; r < rows; r++) {
    let rowStr = `Row ${r}: `;
    for (let c = 0; c < cols; c++) {
      const left = Math.round(c * cellW);
      const top = Math.round(r * cellH);
      const width = Math.round(cellW);
      const height = Math.round(cellH);

      let activePixels = 0;
      for (let y = top; y < top + height; y++) {
        if (y >= h) continue;
        for (let x = left; x < left + width; x++) {
          if (x >= w) continue;
          const idx = (y * w + x) * channels;
          const rVal = data[idx];
          const gVal = data[idx + 1];
          const bVal = data[idx + 2];
          const aVal = channels === 4 ? data[idx + 3] : 255;

          const isBg = rVal < 35 && gVal < 35 && bVal < 35;
          if (!isBg && aVal > 30) {
            activePixels++;
          }
        }
      }
      rowStr += `[Col ${c}: ${activePixels}] `;
    }
    console.log(rowStr);
  }
}

run().catch(console.error);

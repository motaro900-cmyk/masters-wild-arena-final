import sharp from 'sharp';
import fs from 'fs';

async function run() {
  const imgPath = 'public/assets/characters/raccoon/raccoon_poses.png';
  const metadata = await sharp(imgPath).metadata();
  const w = metadata.width;
  const h = metadata.height;

  const cols = 6;
  const rows = 3;
  const cellW = w / cols; // 170.66
  const cellH = h / rows; // 190.33

  if (!fs.existsSync('scratch/raccoon_6x3')) {
    fs.mkdirSync('scratch/raccoon_6x3', { recursive: true });
  }

  const { data, info } = await sharp(imgPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const left = Math.round(c * cellW);
      const top = Math.round(r * cellH);
      const width = Math.round(cellW);
      const height = Math.round(cellH);

      // Check pixel activity in this cell
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

      console.log(`Cell (${r}, ${c}): active pixels = ${activePixels}`);

      if (activePixels > 100) {
        // Save slice
        await sharp(imgPath)
          .extract({ left, top, width, height })
          .toFile(`scratch/raccoon_6x3/cell_${r}_${c}.png`);
      }
    }
  }
}

run().catch(console.error);

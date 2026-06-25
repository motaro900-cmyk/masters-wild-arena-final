import sharp from 'sharp';
import fs from 'fs';

async function run() {
  const imgPath = 'public/assets/characters/raccoon/raccoon_poses.png';
  const metadata = await sharp(imgPath).metadata();
  const w = metadata.width;
  const h = metadata.height;

  const cols = 8;
  const rows = 3;
  const cellW = w / cols; // 128
  const cellH = h / rows; // 190.33

  if (!fs.existsSync('scratch/raccoon_8x3')) {
    fs.mkdirSync('scratch/raccoon_8x3', { recursive: true });
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const left = Math.round(c * cellW);
      const top = Math.round(r * cellH);
      const width = Math.round(cellW);
      const height = Math.round(cellH);

      await sharp(imgPath)
        .extract({ left, top, width, height })
        .toFile(`scratch/raccoon_8x3/cell_${r}_${c}.png`);
    }
  }
  console.log('Saved all 8x3 slices to scratch/raccoon_8x3/');
}

run().catch(console.error);

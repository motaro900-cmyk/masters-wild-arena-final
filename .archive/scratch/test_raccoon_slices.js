import sharp from 'sharp';
import fs from 'fs';

async function run() {
  const imgPath = 'public/assets/characters/raccoon/raccoon_poses.png';
  const metadata = await sharp(imgPath).metadata();
  console.log('Image dimensions:', metadata.width, 'x', metadata.height);

  const cols = 4;
  const rows = 2;
  const frameW = metadata.width / cols;
  const frameH = metadata.height / rows;

  if (!fs.existsSync('scratch/raccoon_debug')) {
    fs.mkdirSync('scratch/raccoon_debug', { recursive: true });
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      await sharp(imgPath)
        .extract({ left: c * frameW, top: r * frameH, width: frameW, height: frameH })
        .toFile(`scratch/raccoon_debug/row${r}_col${c}.png`);
    }
  }

  console.log('Generated test slices in scratch/raccoon_debug/');
}

run().catch(console.error);


import sharp from 'sharp';

async function run() {
  const imgPath = 'public/assets/characters/raccoon/raccoon_poses.png';
  const destPath = 'public/assets/characters/raccoon/raccoon_base.png';

  // Extract Row 0, Col 0 (width = 800, height = 700)
  await sharp(imgPath)
    .extract({ left: 0, top: 0, width: 800, height: 700 })
    .toFile(destPath);

  console.log(`Successfully regenerated ${destPath}`);
}

run().catch(console.error);


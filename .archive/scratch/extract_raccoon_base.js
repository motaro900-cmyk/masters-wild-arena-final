import sharp from 'sharp';

async function run() {
  const imgPath = 'public/assets/characters/raccoon/raccoon_poses.png';
  const destPath = 'public/assets/characters/raccoon/raccoon_base.png';

  // Row 0 has 4 frames. So width per frame is 1024 / 4 = 256.
  // There are 3 rows. Height per row is 571 / 3 = 190.33. Let's use height 190.
  await sharp(imgPath)
    .extract({ left: 0, top: 0, width: 256, height: 190 })
    .toFile(destPath);

  console.log(`Successfully generated ${destPath}`);
}

run().catch(console.error);

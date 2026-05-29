import sharp from 'sharp';
async function run() {
  const metadata = await sharp('public/assets/characters/raccoon/raccoon_poses.png').metadata();
  console.log('Raccoon metadata:', metadata.width, 'x', metadata.height);
}
run();

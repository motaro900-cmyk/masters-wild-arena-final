import sharp from 'sharp';
import { promises as fs } from 'fs';

async function fix() {
  const inputPath = 'public/assets/images/shop/starter_pack.png'; // This is actually a JPEG
  
  // Read the original file
  const buffer = await fs.readFile(inputPath);
  
  // Convert to WebP
  await sharp(buffer)
    .webp({ quality: 85 })
    .toFile('public/assets/images/shop/starter_pack.webp');
  console.log('Successfully created proper starter_pack.webp');

  // Convert to proper PNG
  await sharp(buffer)
    .png()
    .toFile('public/assets/images/shop/starter_pack.png.temp');
  
  // Replace the original png with the real png
  await fs.rename('public/assets/images/shop/starter_pack.png.temp', 'public/assets/images/shop/starter_pack.png');
  console.log('Successfully created proper starter_pack.png');
}

fix().catch(err => {
  console.error('Error fixing images:', err);
});

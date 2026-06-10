import sharp from 'sharp';

const files = [
  {
    src: 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\045c5236-1f75-4df2-bce9-c36818f92404\\ash_mage_armor_1780238486602.png',
    dest: 'C:\\Users\\Motar\\Desktop\\ash_mage_armor.png'
  },
  {
    src: 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\045c5236-1f75-4df2-bce9-c36818f92404\\forest_troll_armor_1780238499125.png',
    dest: 'C:\\Users\\Motar\\Desktop\\forest_troll_armor.png'
  }
];

async function removeBackground() {
  for (const file of files) {
    console.log(`Processing ${file.src}...`);
    const image = sharp(file.src);
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Replace near-white background pixels (R/G/B > 240) with transparency
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 240 && g > 240 && b > 240) {
        data[i + 3] = 0; // Alpha channel to transparent
      }
    }

    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .png()
    .toFile(file.dest);
    
    console.log(`Saved transparent image to ${file.dest}`);
  }
}

removeBackground().catch(console.error);

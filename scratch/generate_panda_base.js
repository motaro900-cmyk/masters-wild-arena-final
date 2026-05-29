import sharp from 'sharp';

async function generate() {
    const imgPath = 'public/assets/characters/panda/panda_poses.png';
    const destPath = 'public/assets/characters/panda/panda_base.png';

    // Extract Row 0, Col 0 (600x670)
    await sharp(imgPath)
        .extract({ left: 0, top: 0, width: 600, height: 670 })
        .toFile(destPath);

    console.log(`Successfully generated ${destPath}`);
}

generate().catch(console.error);

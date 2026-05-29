import sharp from 'sharp';

async function run() {
    const imgPath = 'public/assets/characters/panda/panda_poses.png';
    const destPath = 'public/assets/characters/panda/panda_base.png';

    // Bounding box of content in Cell 0, 0:
    // left: 189, top: 79, width: 411, height: 527
    // Let's crop this box:
    const cropped = await sharp(imgPath)
        .extract({ left: 189, top: 79, width: 411, height: 527 })
        .toBuffer();

    // Now let's pad it to 600x600.
    // To center horizontally: left padding = (600 - 411) / 2 = 94 (approx)
    // To align feet towards the bottom: top padding = 40, bottom padding = 33
    // Total height = 527 + 40 + 33 = 600
    await sharp(cropped)
        .extend({
            top: 40,
            bottom: 33,
            left: 94,
            right: 95,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(destPath);

    console.log("Panda base centered and generated successfully!");
}

run().catch(console.error);

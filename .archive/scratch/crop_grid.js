import sharp from 'sharp';
import fs from 'fs';

async function cropGrid() {
    const imgPath = 'public/assets/characters/panda/panda_poses.png';
    const outDir = 'C:/Users/Motar/.gemini/antigravity/brain/0feaab35-bfc8-4a78-994a-d84e254b78e9';

    const cols = 4;
    const rows = 2;
    const width = 600; // 2400 / 4
    const height = 670; // 1340 / 2

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const left = c * width;
            const top = r * height;
            const filename = `${outDir}/panda_grid_${r}_${c}.png`;

            await sharp(imgPath)
                .extract({ left, top, width, height })
                .toFile(filename);

            console.log(`Saved ${filename}`);
        }
    }
}

cropGrid().catch(console.error);

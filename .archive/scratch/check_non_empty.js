import sharp from 'sharp';

async function check() {
    const outDir = 'C:/Users/Motar/.gemini/antigravity/brain/0feaab35-bfc8-4a78-994a-d84e254b78e9';
    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
            const filename = `${outDir}/panda_grid_${r}_${c}.png`;
            const image = sharp(filename);
            const { width, height } = await image.metadata();
            const raw = await image.raw().toBuffer();
            let minX = width, maxX = 0, minY = height, maxY = 0;
            let opaquePixels = 0;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    if (raw[idx + 3] > 10) { // alpha > 10
                        opaquePixels++;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (opaquePixels > 100) {
                console.log(`Cell [${r}, ${c}]: content bounds: X[${minX}..${maxX}] Y[${minY}..${maxY}], width=${maxX-minX+1}, height=${maxY-minY+1}, opaquePixels=${opaquePixels}`);
            } else {
                console.log(`Cell [${r}, ${c}]: EMPTY`);
            }
        }
    }
}

check().catch(console.error);

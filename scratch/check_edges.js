import sharp from 'sharp';

async function checkEdges() {
    const imgPath = 'public/assets/characters/panda/panda_poses.png';
    const image = sharp(imgPath);
    const { width, height } = await image.metadata();
    const raw = await image.raw().toBuffer();

    const cols = 4;
    const rows = 2;
    const frameW = 600;
    const frameH = 670;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let leftEdgeAlpha = 0;
            let rightEdgeAlpha = 0;
            let topEdgeAlpha = 0;
            let bottomEdgeAlpha = 0;

            const startX = c * frameW;
            const startY = r * frameH;

            // Check left edge (x = 0 inside frame) and right edge (x = frameW - 1)
            for (let y = 0; y < frameH; y++) {
                const globalY = startY + y;
                
                // Left
                const idxLeft = (globalY * width + startX) * 4;
                if (raw[idxLeft + 3] > 10) leftEdgeAlpha++;

                // Right
                const idxRight = (globalY * width + (startX + frameW - 1)) * 4;
                if (raw[idxRight + 3] > 10) rightEdgeAlpha++;
            }

            // Check top and bottom edges
            for (let x = 0; x < frameW; x++) {
                const globalX = startX + x;

                // Top
                const idxTop = (startY * width + globalX) * 4;
                if (raw[idxTop + 3] > 10) topEdgeAlpha++;

                // Bottom
                const idxBottom = ((startY + frameH - 1) * width + globalX) * 4;
                if (raw[idxBottom + 3] > 10) bottomEdgeAlpha++;
            }

            if (leftEdgeAlpha > 0 || rightEdgeAlpha > 0 || topEdgeAlpha > 0 || bottomEdgeAlpha > 0) {
                console.log(`Frame [${r}, ${c}]: Edge alpha pixels -> Left: ${leftEdgeAlpha}, Right: ${rightEdgeAlpha}, Top: ${topEdgeAlpha}, Bottom: ${bottomEdgeAlpha}`);
            } else {
                console.log(`Frame [${r}, ${c}]: CLEAN EDGES`);
            }
        }
    }
}

checkEdges().catch(console.error);

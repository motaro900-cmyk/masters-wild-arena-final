import sharp from 'sharp';

async function rebuild() {
    const imgPath = 'public/assets/characters/panda/panda_poses.png';
    const image = sharp(imgPath);
    const { width, height } = await image.metadata();
    const raw = await image.raw().toBuffer();

    console.log(`Input size: ${width}x${height}`);

    // Visited array
    const visited = new Uint8Array(width * height);
    const components = [];
    const getIdx = (x, y) => (y * width + x) * 4;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = getIdx(x, y);
            const alpha = raw[idx + 3];
            const pos = y * width + x;

            if (alpha > 10 && visited[pos] === 0) {
                const comp = {
                    pixels: [],
                    minX: x, maxX: x, minY: y, maxY: y
                };

                const queue = [pos];
                visited[pos] = 1;

                let qIdx = 0;
                while (qIdx < queue.length) {
                    const currentPos = queue[qIdx++];
                    const cy = Math.floor(currentPos / width);
                    const cx = currentPos % width;

                    comp.pixels.push(currentPos);
                    if (cx < comp.minX) comp.minX = cx;
                    if (cx > comp.maxX) comp.maxX = cx;
                    if (cy < comp.minY) comp.minY = cy;
                    if (cy > comp.maxY) comp.maxY = cy;

                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const nx = cx + dx;
                            const ny = cy + dy;

                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const nPos = ny * width + nx;
                                if (visited[nPos] === 0) {
                                    const nIdx = getIdx(nx, ny);
                                    if (raw[nIdx + 3] > 10) {
                                        visited[nPos] = 1;
                                        queue.push(nPos);
                                    }
                                }
                            }
                        }
                    }
                }

                if (comp.pixels.length > 500) {
                    components.push(comp);
                }
            }
        }
    }

    console.log(`Found ${components.length} components.`);
    components.sort((a, b) => b.pixels.length - a.pixels.length);

    // Map each component to target pose index (0 to 7)
    // Poses mapping:
    // Row 0: centerY < 670
    // Row 1: centerY >= 670
    const poses = new Array(8);

    components.forEach((c) => {
        const centerX = (c.minX + c.maxX) / 2;
        const centerY = (c.minY + c.maxY) / 2;

        let row = centerY < 670 ? 0 : 1;
        let col = 0;
        if (centerX < 600) col = 0;
        else if (centerX >= 600 && centerX < 1200) col = 1;
        else if (centerX >= 1200 && centerX < 1800) col = 2;
        else col = 3;

        const idx = row * 4 + col;
        poses[idx] = c;
        console.log(`Assigned component size=${c.pixels.length} to Pose #${idx} (Row ${row}, Col ${col})`);
    });

    // Create a new canvas of size 2800x1400 (4 cols, 2 rows of 700x700 cells)
    const outWidth = 2800;
    const outHeight = 1400;
    const cellW = 700;
    const cellH = 700;
    const outBuffer = Buffer.alloc(outWidth * outHeight * 4); // filled with 0s (transparent)

    // Baselines
    const baselineRow0 = 570;
    const baselineRow1 = 1180;
    const destBaseline = 620; // standing height in each 700x700 cell

    for (let i = 0; i < 8; i++) {
        const c = poses[i];
        if (!c) continue;

        const row = Math.floor(i / 4);
        const col = i % 4;

        const srcBaseline = row === 0 ? baselineRow0 : baselineRow1;
        const charCenterX = (c.minX + c.maxX) / 2;

        // Draw each pixel to the destination cell
        c.pixels.forEach((pos) => {
            const y = Math.floor(pos / width);
            const x = pos % width;

            // Coordinates relative to character center and baseline
            const relX = x - charCenterX;
            const relY = y - srcBaseline;

            // Target coordinates inside the 700x700 cell
            const destX = Math.round(350 + relX);
            const destY = Math.round(destBaseline + relY);

            if (destX >= 0 && destX < cellW && destY >= 0 && destY < cellH) {
                // Global coordinates in the 2800x1400 canvas
                const gX = col * cellW + destX;
                const gY = row * cellH + destY;

                const srcIdx = pos * 4;
                const destIdx = (gY * outWidth + gX) * 4;

                outBuffer[destIdx] = raw[srcIdx];
                outBuffer[destIdx + 1] = raw[srcIdx + 1];
                outBuffer[destIdx + 2] = raw[srcIdx + 2];
                outBuffer[destIdx + 3] = raw[srcIdx + 3];
            }
        });
    }

    // Save the new spritesheet
    const destSheetPath = 'public/assets/characters/panda/panda_poses.png';
    await sharp(outBuffer, { raw: { width: outWidth, height: outHeight, channels: 4 } })
        .png()
        .toFile('public/assets/characters/panda/panda_poses_temp.png');

    // Replace the old poses file
    import('fs').then(fs => {
        fs.default.copyFileSync('public/assets/characters/panda/panda_poses_temp.png', destSheetPath);
        fs.default.unlinkSync('public/assets/characters/panda/panda_poses_temp.png');
        console.log(`Rebuilt and overwritten ${destSheetPath}`);
    });

    // Also extract Pose 0 and save as panda_base.png (size 700x700)
    const baseBuffer = Buffer.alloc(cellW * cellH * 4);
    for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
            const srcIdx = (y * outWidth + x) * 4;
            const destIdx = (y * cellW + x) * 4;
            baseBuffer[destIdx] = outBuffer[srcIdx];
            baseBuffer[destIdx + 1] = outBuffer[srcIdx + 1];
            baseBuffer[destIdx + 2] = outBuffer[srcIdx + 2];
            baseBuffer[destIdx + 3] = outBuffer[srcIdx + 3];
        }
    }

    const destBasePath = 'public/assets/characters/panda/panda_base.png';
    await sharp(baseBuffer, { raw: { width: cellW, height: cellH, channels: 4 } })
        .png()
        .toFile('public/assets/characters/panda/panda_base_temp.png');

    import('fs').then(fs => {
        fs.default.copyFileSync('public/assets/characters/panda/panda_base_temp.png', destBasePath);
        fs.default.unlinkSync('public/assets/characters/panda/panda_base_temp.png');
        console.log(`Rebuilt and overwritten ${destBasePath}`);
    });
}

rebuild().catch(console.error);

import sharp from 'sharp';

async function find() {
    const imgPath = 'public/assets/characters/panda/panda_poses.png';
    const image = sharp(imgPath);
    const { width, height } = await image.metadata();
    const raw = await image.raw().toBuffer();

    console.log(`Image: ${width}x${height}`);

    // Visited array
    const visited = new Uint8Array(width * height);
    const components = [];

    // Helper to get pixel index
    const getIdx = (x, y) => (y * width + x) * 4;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = getIdx(x, y);
            const alpha = raw[idx + 3];
            const pos = y * width + x;

            if (alpha > 10 && visited[pos] === 0) {
                // Start BFS
                const comp = {
                    pixels: [],
                    minX: x,
                    maxX: x,
                    minY: y,
                    maxY: y
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

                    // 4-neighborhood or 8-neighborhood. Let's use 8-neighborhood.
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

                if (comp.pixels.length > 500) { // filter out noise
                    components.push(comp);
                }
            }
        }
    }

    console.log(`Found ${components.length} components.`);
    components.sort((a, b) => b.pixels.length - a.pixels.length);

    components.slice(0, 12).forEach((c, idx) => {
        console.log(`Comp #${idx}: size=${c.pixels.length}, X:[${c.minX}..${c.maxX}] (W=${c.maxX-c.minX+1}), Y:[${c.minY}..${c.maxY}] (H=${c.maxY-c.minY+1})`);
    });
}

find().catch(console.error);

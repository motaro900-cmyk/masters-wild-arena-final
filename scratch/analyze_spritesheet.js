import sharp from 'sharp';

async function analyze() {
    const image = sharp('public/assets/characters/raccoon/raccoon_poses.png');
    const { width, height } = await image.metadata();
    console.log(`Image size: ${width}x${height}`);

    const raw = await image.raw().toBuffer();

    // Let's divide into a grid or scan for non-empty regions.
    // Let's print row/col transparency to understand the spacing.
    // For example, average alpha values across rows/columns.
    const colAlphas = new Array(width).fill(0);
    const rowAlphas = new Array(height).fill(0);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const alpha = raw[idx + 3];
            colAlphas[x] += alpha;
            rowAlphas[y] += alpha;
        }
    }

    // Let's analyze row intervals where alpha is > 0
    let inRow = false;
    let startRow = 0;
    const rowIntervals = [];
    for (let y = 0; y < height; y++) {
        const averageAlpha = rowAlphas[y] / width;
        const hasContent = averageAlpha > 1; // threshold
        if (hasContent && !inRow) {
            inRow = true;
            startRow = y;
        } else if (!hasContent && inRow) {
            inRow = false;
            rowIntervals.push({ start: startRow, end: y - 1 });
        }
    }
    if (inRow) {
        rowIntervals.push({ start: startRow, end: height - 1 });
    }

    console.log('Row content intervals:', rowIntervals);

    // Let's analyze col intervals in general
    let inCol = false;
    let startCol = 0;
    const colIntervals = [];
    for (let x = 0; x < width; x++) {
        const averageAlpha = colAlphas[x] / height;
        const hasContent = averageAlpha > 1;
        if (hasContent && !inCol) {
            inCol = true;
            startCol = x;
        } else if (!hasContent && inCol) {
            inCol = false;
            colIntervals.push({ start: startCol, end: x - 1 });
        }
    }
    if (inCol) {
        colIntervals.push({ start: startCol, end: width - 1 });
    }

    console.log('Col content intervals:', colIntervals.length, 'intervals');
    if (colIntervals.length < 30) {
        console.log(colIntervals);
    }
}

analyze().catch(console.error);

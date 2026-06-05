import sharp from 'sharp';

async function checkImage(filePath) {
    try {
        const metadata = await sharp(filePath).metadata();
        console.log(`File: ${filePath}`);
        console.log(`Format: ${metadata.format}`);
        console.log(`Width: ${metadata.width}, Height: ${metadata.height}`);
        console.log('---');
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
    }
}

async function run() {
    console.log('=== Frames & Shop Icons ===');
    await checkImage('public/assets/images/frames/harvest_wheat_frame.webp');
    await checkImage('public/assets/images/shop/bank_gold_small.webp');
    await checkImage('public/assets/images/shop/bank_gold_medium.webp');
    await checkImage('public/assets/images/shop/bank_gold_large.webp');
}

run();

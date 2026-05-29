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
    await checkImage('public/assets/images/items/weapons/moon_sword.webp');
    await checkImage('public/assets/images/items/weapons/axe.webp');
    await checkImage('public/assets/images/items/weapons/void_staff.webp');
}

run();

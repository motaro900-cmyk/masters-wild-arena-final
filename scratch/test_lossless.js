import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const pngPath = 'public/assets/characters/panda/panda_poses.png.png';
const losslessPath = 'public/assets/characters/panda/panda_poses_lossless.webp';
const lossy90Path = 'public/assets/characters/panda/panda_poses.png.webp';

async function test() {
    const pngSize = fs.statSync(pngPath).size;
    const lossySize = fs.statSync(lossy90Path).size;

    console.log(`Original PNG size: ${(pngSize / 1024).toFixed(2)} KB`);
    console.log(`Lossy WebP (Q=90) size: ${(lossySize / 1024).toFixed(2)} KB`);

    // Convert to Lossless WebP
    await sharp(pngPath)
        .webp({ lossless: true })
        .toFile(losslessPath);

    const losslessSize = fs.statSync(losslessPath).size;
    console.log(`Lossless WebP size: ${(losslessSize / 1024).toFixed(2)} KB`);
    console.log(`Reduction compared to PNG: ${((1 - losslessSize / pngSize) * 100).toFixed(2)}%`);
}

test().catch(console.error);

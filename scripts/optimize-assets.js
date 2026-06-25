/**
 * @owner: @Motaro900 / QA Team
 * @purpose: Основной скрипт оптимизации ассетов и копирования атласов. Вызывается при запуске npm run build и npm run optimize.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_ROOT = path.join(__dirname, '../assets-src');
const DEST_ROOT = path.join(__dirname, '../public/assets');

const QUALITY_PC = 90;
const QUALITY_MOBILE = 85;

const PC_MAX_WIDTH = 2560; // 2K resolution cap for PC backgrounds
const MOBILE_WIDTH = 1280; // 720p for mobile backgrounds

// Helper to ensure target directory exists
function ensureDirExists(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}

// STRICT COMPLIANCE GUARD: Prevent any destructive clean/wipe operations on DEST_ROOT (public/assets)
const args = process.argv.slice(2);
if (args.includes('--clean') || args.includes('--wipe') || args.includes('--reset')) {
    console.error('🚨 FATAL ERROR: Destructive operations on public/assets are strictly forbidden by AGENTS.md compliance guidelines.');
    process.exit(1);
}

// Ensure destination root exists (Incremental build, do NOT wipe)
if (!fs.existsSync(DEST_ROOT)) {
    fs.mkdirSync(DEST_ROOT, { recursive: true });
}

async function processDirectory(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await processDirectory(fullPath);
        } else {
            await processFile(fullPath);
        }
    }
}

async function processFile(filePath) {
    const relativePath = path.relative(SRC_ROOT, filePath);
    const destPath = path.join(DEST_ROOT, relativePath);
    const normalizedRelative = relativePath.replace(/\\/g, '/').toLowerCase();
    const ext = path.extname(filePath).toLowerCase();

    // Ignore webp files in source folder if there is a corresponding source image (.png/.jpg/.jpeg)
    if (ext === '.webp') {
        const pngPath = filePath.replace(/\.webp$/i, '.png');
        const jpgPath = filePath.replace(/\.webp$/i, '.jpg');
        const jpegPath = filePath.replace(/\.webp$/i, '.jpeg');
        if (fs.existsSync(pngPath) || fs.existsSync(jpgPath) || fs.existsSync(jpegPath)) {
            return;
        }
    }

    const fileName = path.basename(filePath, ext);
    const destDir = path.dirname(destPath);

    // If it's already a mobile version, just copy it to destination directly
    if (fileName.toLowerCase().endsWith('_mobile')) {
        ensureDirExists(destPath);
        fs.copyFileSync(filePath, destPath);
        console.log(`📋 Copied already optimized mobile file: ${relativePath}`);
        return;
    }

    // 1. Direct Copy Rule: audio/, fx/, ui/, resources/, shop/, sheets/, frames/, myicons/
    const isDirectCopy = 
        normalizedRelative.startsWith('audio/') ||
        normalizedRelative.startsWith('fx/') ||
        normalizedRelative.includes('images/ui/') ||
        normalizedRelative.includes('images/resources/') ||
        normalizedRelative.includes('images/shop/') ||
        normalizedRelative.includes('images/sheets/') ||
        normalizedRelative.includes('images/frames/') ||
        normalizedRelative.includes('images/myicons/');

    if (isDirectCopy) {
        ensureDirExists(destPath);
        fs.copyFileSync(filePath, destPath);
        console.log(`📋 Copied: ${relativePath}`);

        // If it's a PNG/JPG/JPEG in the direct copy folder, also generate a WebP version
        // just in case the code references it as .webp
        if (['.png', '.jpg', '.jpeg'].includes(ext)) {
            const webpDestPath = destPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
            await sharp(filePath)
                .webp({ quality: QUALITY_PC })
                .toFile(webpDestPath);
            console.log(`⚡ Also generated WebP for direct-copy UI asset: ${path.relative(DEST_ROOT, webpDestPath)}`);
        }
        return;
    }

    // 2. JSON files (like spritesheets) -> copy directly
    if (ext === '.json') {
        ensureDirExists(destPath);
        fs.copyFileSync(filePath, destPath);
        console.log(`📋 Copied JSON: ${relativePath}`);
        return;
    }

    // Only process images from here on
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        return;
    }

    const buffer = fs.readFileSync(filePath);

    // 3. Backgrounds Rule
    const isBackground = normalizedRelative.includes('backgrounds/') || fileName === 'shop' || fileName === 'shoping' || fileName === 'shop phone';
    if (isBackground) {
        const outputWebp = path.join(destDir, `${fileName}.webp`);
        const outputMobile = path.join(destDir, `${fileName}_mobile.webp`);
        ensureDirExists(outputWebp);

        if (ext === '.webp') {
            fs.copyFileSync(filePath, outputWebp);
        } else {
            // PC version (WebP Lossy Q=90, max width 2560)
            await sharp(buffer)
                .resize({ width: PC_MAX_WIDTH, withoutEnlargement: true })
                .webp({ quality: QUALITY_PC })
                .toFile(outputWebp);
        }

        // Mobile version (WebP Lossy Q=85, max width 1280)
        await sharp(buffer)
            .resize({ width: MOBILE_WIDTH, withoutEnlargement: true })
            .webp({ quality: QUALITY_MOBILE })
            .toFile(outputMobile);

        console.log(`🖼️ Processed Background: ${relativePath} -> WebP (PC & Mobile)`);
        return;
    }

    // 4. Items Rule
    const isItem = normalizedRelative.includes('images/items/');
    if (isItem) {
        const outputWebp = path.join(destDir, `${fileName}.webp`);
        const outputMobile = path.join(destDir, `${fileName}_mobile.webp`);
        ensureDirExists(outputWebp);

        if (ext === '.webp') {
            fs.copyFileSync(filePath, outputWebp);
        } else {
            // PC version (WebP Lossy Q=90)
            await sharp(buffer)
                .webp({ quality: QUALITY_PC })
                .toFile(outputWebp);
        }

        // Mobile version (WebP Lossy Q=85, downscaled 256x256)
        await sharp(buffer)
            .resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: QUALITY_MOBILE })
            .toFile(outputMobile);

        console.log(`⚔️ Processed Item: ${relativePath} -> WebP (PC & Mobile)`);
        return;
    }

    // 5. Avatars Rule
    const isAvatar = normalizedRelative.includes('images/avatars/');
    if (isAvatar) {
        const outputWebp = path.join(destDir, `${fileName}.webp`);
        const outputMobile = path.join(destDir, `${fileName}_mobile.webp`);
        ensureDirExists(outputWebp);

        if (ext === '.webp') {
            fs.copyFileSync(filePath, outputWebp);
        } else {
            // PC version (WebP Lossy Q=90)
            await sharp(buffer)
                .webp({ quality: QUALITY_PC })
                .toFile(outputWebp);
        }

        // Mobile version (WebP Lossy Q=85, downscaled 256x256)
        await sharp(buffer)
            .resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: QUALITY_MOBILE })
            .toFile(outputMobile);

        console.log(`👤 Processed Avatar: ${relativePath} -> WebP (PC & Mobile)`);
        return;
    }

    // 6. Heroes, Skins & Bosses (PC: PNG, Mobile: WebP)
    const isHeroOrSkin = normalizedRelative.includes('characters/') && !normalizedRelative.includes('characters/ancients/');
    const isBoss = normalizedRelative.includes('ancient_treant') || normalizedRelative.includes('ancient_griffin');

    if (isHeroOrSkin || isBoss) {
        // Copy original PNG directly for PC
        ensureDirExists(destPath);
        fs.copyFileSync(filePath, destPath);

        // Generate _mobile.webp (downscaled 512x512, Q=85)
        const outputMobile = path.join(destDir, `${fileName}_mobile.webp`);
        await sharp(buffer)
            .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: QUALITY_MOBILE })
            .toFile(outputMobile);

        console.log(`👑 Processed Hero/Boss: ${relativePath} -> PNG (PC) & Mobile WebP`);
        return;
    }

    // 7. Common Mobs (PC: WebP Lossy Q=90, Mobile: WebP Q=85)
    const isCommonMob = normalizedRelative.includes('characters/ancients/');
    if (isCommonMob) {
        const outputWebp = path.join(destDir, `${fileName}.webp`);
        const outputMobile = path.join(destDir, `${fileName}_mobile.webp`);
        ensureDirExists(outputWebp);

        if (ext === '.webp') {
            fs.copyFileSync(filePath, outputWebp);
        } else {
            // PC version (WebP Lossy Q=90)
            await sharp(buffer)
                .webp({ quality: QUALITY_PC })
                .toFile(outputWebp);
        }

        // Mobile version (WebP Lossy Q=85, downscaled 512x512)
        await sharp(buffer)
            .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: QUALITY_MOBILE })
            .toFile(outputMobile);

        console.log(`👾 Processed Mob: ${relativePath} -> WebP (PC & Mobile)`);
        return;
    }
}

console.log('🚀 Starting asset optimization & distribution build...');
processDirectory(SRC_ROOT)
    .then(async () => {
        // Copy generated atlas files from build/atlas to DEST_ROOT (public/assets)
        const ATLAS_SRC_DIR = path.join(__dirname, '../build/atlas');
        const atlasFiles = [
            'images/items/weapons/items.webp',
            'images/items/weapons/items_mobile.webp',
            'images/items/weapons/items.json',
            'images/items/weapons/items_mobile.json'
        ];
        
        let copiedCount = 0;
        atlasFiles.forEach(file => {
            const srcFile = path.join(ATLAS_SRC_DIR, file);
            const destFile = path.join(DEST_ROOT, file);
            if (fs.existsSync(srcFile)) {
                ensureDirExists(destFile);
                fs.copyFileSync(srcFile, destFile);
                copiedCount++;
            }
        });
        
        if (copiedCount > 0) {
            console.log(`📦 Successfully copied ${copiedCount} atlas files from build/atlas to public/assets`);
        } else {
            console.warn('⚠️ No atlas files found in build/atlas. Make sure to run generate-items-atlas.js first if needed.');
        }

        console.log('✨ All assets distributed & optimized successfully!');
    })
    .catch(err => console.error('💥 Fatal error in asset distribution:', err));

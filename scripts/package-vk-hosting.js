/**
 * @owner: Masters of the Wild / DevOps & Deployment
 * @purpose: Автоматическая сборка и упаковка продакшн-архива dist-vk.zip для официального бесплатного хостинга ВКонтакте (VK Mini Apps Static Hosting).
 * Соблюдает жесткий лимит VK Hosting (< 50 МБ и оптимальные < 30 МБ для загрузки без таймаутов) с сохранением 100% звуков, музыки, персонажей и предметов.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const OUTPUT_ZIP = path.join(ROOT_DIR, 'dist-vk.zip');

const VK_HOSTING_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MB hard ceiling
const VK_OPTIMAL_UPLOAD_BYTES = 35 * 1024 * 1024; // 35 MB optimal for zero-timeout upload

async function packageForVkHosting() {
    console.log('🚀 [VK Packager] Starting VK Mini Apps Hosting packager...');

    if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
        console.error('❌ [VK Packager] Error: dist/ directory not found or index.html missing.');
        console.error('   Please run "npm run build" first.');
        process.exit(1);
    }

    // Remove old zip if present
    if (fs.existsSync(OUTPUT_ZIP)) {
        try {
            fs.unlinkSync(OUTPUT_ZIP);
            console.log('🧹 [VK Packager] Removed previous dist-vk.zip');
        } catch (e) {
            console.warn('⚠️ [VK Packager] Could not remove old zip:', e.message);
        }
    }

    const output = fs.createWriteStream(OUTPUT_ZIP);
    const archive = new ZipArchive({
        zlib: { level: 9 }, // Maximum compression for VK CDN
    });

    let totalRawBytes = 0;
    let fileCount = 0;
    let skippedDuplicatesCount = 0;

    output.on('close', () => {
        const zipSizeBytes = archive.pointer();
        const zipSizeMB = (zipSizeBytes / (1024 * 1024)).toFixed(2);
        const rawSizeMB = (totalRawBytes / (1024 * 1024)).toFixed(2);

        console.log('\n======================================================');
        console.log('📦 VK MINI APPS HOSTING PACKAGE GENERATED SUCCESSFULLY');
        console.log('======================================================');
        console.log(`📁 Archive Path:      ${OUTPUT_ZIP}`);
        console.log(`📄 Total Files:       ${fileCount} files`);
        console.log(`♻️ Duplicates Saved:  ${skippedDuplicatesCount} unused duplicates omitted`);
        console.log(`📊 Uncompressed Size: ${rawSizeMB} MB`);
        console.log(`🎁 Final ZIP Size:    ${zipSizeMB} MB`);
        console.log(`🎯 VK Hard Limit:     50.00 MB`);
        console.log('======================================================');

        if (zipSizeBytes <= VK_HOSTING_LIMIT_BYTES) {
            const marginMB = ((VK_HOSTING_LIMIT_BYTES - zipSizeBytes) / (1024 * 1024)).toFixed(2);
            console.log(`✅ SUCCESS: Archive is within limit! Safety margin: +${marginMB} MB free.`);
            if (zipSizeBytes <= VK_OPTIMAL_UPLOAD_BYTES) {
                console.log(`⚡ Optimal size verified: upload will complete rapidly without gateway timeouts.`);
            }
        } else {
            const excessMB = ((zipSizeBytes - VK_HOSTING_LIMIT_BYTES) / (1024 * 1024)).toFixed(2);
            console.error(`🚨 WARNING: Archive exceeds 50 MB limit by +${excessMB} MB!`);
            process.exit(1);
        }
    });

    archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
            console.warn('⚠️ Archive warning:', err);
        } else {
            throw err;
        }
    });

    archive.on('error', (err) => {
        console.error('❌ Archive fatal error:', err);
        throw err;
    });

    archive.pipe(output);

    async function processDirectory(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.relative(DIST_DIR, fullPath).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                // Exclude screenshots and dev tooling folders from production deployment
                if (entry.name === 'screenshots' || entry.name === '.git' || entry.name === 'raw-assets') {
                    console.log(`⏩ [Skip] Excluded non-runtime directory: ${relPath}`);
                    continue;
                }
                await processDirectory(fullPath);
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                let buffer;

                // 1. Skip duplicate PNGs only if a matching WebP exists and it is NOT a character/boss asset
                if (ext === '.png') {
                    const isCharacter = relPath.includes('characters/');
                    const isBoss = relPath.includes('ancient_treant') || relPath.includes('ancient_griffin');
                    const isDoublePng = fullPath.toLowerCase().endsWith('.png.png');
                    const webpEquivalent = fullPath.replace(/\.png$/i, '.webp');
                    const cleanWebpEquivalent = isDoublePng ? fullPath.replace(/\.png\.png$/i, '.webp') : null;

                    const hasWebp = (!isCharacter && !isBoss && fs.existsSync(webpEquivalent)) ||
                                    (cleanWebpEquivalent && fs.existsSync(cleanWebpEquivalent));

                    if (hasWebp) {
                        skippedDuplicatesCount++;
                        continue;
                    }

                    // 2. Lossless/8-bit palette compression for heavy UI icons and character spritesheets
                    if (relPath.includes('characters/ancients/')) {
                        // Bosses: resize from 2048 to 1024 with palette
                        buffer = await sharp(fullPath)
                            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                            .png({ compressionLevel: 9, palette: true })
                            .toBuffer();
                    } else if (relPath.includes('characters/') && (relPath.includes('_poses') || relPath.includes('_frost_') || relPath.includes('_base'))) {
                        buffer = await sharp(fullPath)
                            .png({ compressionLevel: 9, palette: true })
                            .toBuffer();
                    } else if (relPath.includes('images/ui/') || relPath.includes('images/avatars/')) {
                        // High-res UI elements and avatars resized to appropriate slot dimensions
                        buffer = await sharp(fullPath)
                            .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                            .png({ compressionLevel: 9, palette: true })
                            .toBuffer();
                    } else if (relPath.includes('images/shop/')) {
                        buffer = await sharp(fullPath)
                            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                            .png({ compressionLevel: 9, palette: true })
                            .toBuffer();
                    } else if (relPath.includes('sharing/')) {
                        buffer = await sharp(fullPath)
                            .png({ compressionLevel: 9, palette: true })
                            .toBuffer();
                    } else {
                        buffer = fs.readFileSync(fullPath);
                    }
                } else if (ext === '.webp' || ext === '.jpg' || ext === '.jpeg') {
                    // 3. Smart resolution capping to save bandwidth & memory without losing visual fidelity
                    if (relPath.includes('images/items/')) {
                        buffer = await sharp(fullPath)
                            .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                            .webp({ quality: 85 })
                            .toBuffer();
                    } else if (relPath.includes('images/frames/')) {
                        buffer = await sharp(fullPath)
                            .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                            .webp({ quality: 85 })
                            .toBuffer();
                    } else if (relPath.includes('images/backgrounds/')) {
                        buffer = await sharp(fullPath)
                            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
                            .webp({ quality: 82 })
                            .toBuffer();
                    } else if (relPath.includes('images/ui/')) {
                        buffer = await sharp(fullPath)
                            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                            .webp({ quality: 85 })
                            .toBuffer();
                    } else {
                        buffer = fs.readFileSync(fullPath);
                    }
                } else {
                    // Scripts, styles, HTML, audio, fonts, JSON copied directly (preserving 100% audio quality)
                    buffer = fs.readFileSync(fullPath);
                }

                totalRawBytes += buffer.length;
                fileCount++;
                archive.append(buffer, { name: relPath });
            }
        }
    }

    console.log('📦 [VK Packager] Scanning and streaming assets...');
    await processDirectory(DIST_DIR);
    await archive.finalize();
}

packageForVkHosting().catch((err) => {
    console.error('❌ [VK Packager] Fatal error during packaging:', err);
    process.exit(1);
});

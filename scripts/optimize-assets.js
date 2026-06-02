import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Настройки
const ASSETS_ROOT = path.join(__dirname, '../public/assets');
const QUALITY_PC = 90;
const QUALITY_MOBILE = 75;
const MOBILE_WIDTH = 1280; // 720p

async function processDirectory(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await processDirectory(fullPath);
        } else if (file.match(/\.(png|jpg|jpeg|webp)$/i) && !file.includes('_mobile.webp')) {
            await optimizeImage(fullPath);
        }
    }
}

const PC_MAX_WIDTH = 2560; // 2K resolution cap for PC to save GPU VRAM

async function optimizeImage(filePath) {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    const isBackground = filePath.includes('backgrounds') || filePath.includes('Shop.png') || filePath.includes('Shoping.png') || filePath.includes('Shop.webp') || filePath.includes('Shoping.webp');

    const outputWebp = ext.toLowerCase() === '.webp' ? filePath : path.join(dir, `${fileName}.webp`);
    const outputMobile = path.join(dir, `${fileName}_mobile.webp`);

    try {
        const buffer = fs.readFileSync(filePath);
        
        // 1. Создаем основную WebP версию (PC) с лимитом разрешения
        let pcImage = sharp(buffer);
        if (isBackground) {
            pcImage = pcImage.resize({ width: PC_MAX_WIDTH, withoutEnlargement: true });
        }
        await pcImage
            .webp({ quality: QUALITY_PC })
            .toFile(outputWebp);
        
        console.log(`✅ Converted/Optimized: ${path.relative(ASSETS_ROOT, outputWebp)}`);

        // 2. Если это фон, создаем мобильную версию (720p)
        if (isBackground) {
            await sharp(buffer)
                .resize({ width: MOBILE_WIDTH, withoutEnlargement: true })
                .webp({ quality: QUALITY_MOBILE })
                .toFile(outputMobile);
            
            console.log(`📱 Created Mobile version: ${path.relative(ASSETS_ROOT, outputMobile)}`);
        }
    } catch (err) {
        console.error(`❌ Error processing ${filePath}:`, err.message);
    }
}

console.log('🚀 Starting assets optimization...');
processDirectory(ASSETS_ROOT)
    .then(() => console.log('✨ All assets optimized!'))
    .catch(err => console.error('💥 Fatal error:', err));

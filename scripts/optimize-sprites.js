import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const itemsDir = path.join(__dirname, '../public/assets/images/items');

function processDir(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`Directory does not exist: ${dir}`);
        return;
    }
    const files = fs.readdirSync(dir);
    files.forEach(async file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.png')) {
            const output = fullPath.replace('.png', '.webp');
            try {
                await sharp(fullPath)
                    .webp({ quality: 85 })
                    .toFile(output);
                console.log(`✅ Converted: ${path.relative(itemsDir, output)}`);
            } catch (err) {
                console.error(`❌ Failed to convert ${file}:`, err.message);
            }
        }
    });
}

console.log('🚀 Optimizing item sprites (ESM)...');
processDir(itemsDir);

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const srcDir = 'assets-src/images/items/';
const tempDir = 'temp/items-png/';

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

async function convertDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            await convertDir(fullPath);
        } else {
            const ext = path.extname(file).toLowerCase();
            const baseName = path.basename(file, ext);
            // Пропускаем мобильные версии
            if (baseName.endsWith('_mobile')) continue;

            if (ext === '.webp') {
                const relativeDir = path.relative(srcDir, dir);
                const targetFolder = path.join(tempDir, relativeDir);
                if (!fs.existsSync(targetFolder)) {
                    fs.mkdirSync(targetFolder, { recursive: true });
                }
                const targetPath = path.join(targetFolder, baseName + '.png');
                await sharp(fullPath).png().toFile(targetPath);
                console.log(`Converted: ${file} -> ${targetPath}`);
            } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
                const relativeDir = path.relative(srcDir, dir);
                const targetFolder = path.join(tempDir, relativeDir);
                if (!fs.existsSync(targetFolder)) {
                    fs.mkdirSync(targetFolder, { recursive: true });
                }
                const targetPath = path.join(targetFolder, file);
                fs.copyFileSync(fullPath, targetPath);
                console.log(`Copied image: ${file} -> ${targetPath}`);
            }
        }
    }
}

console.log('Starting conversion of items to PNG...');
convertDir(srcDir)
    .then(() => console.log('✨ All items successfully prepared as PNG in temp/items-png/!'))
    .catch(err => console.error('💥 Error preparing PNG assets:', err));

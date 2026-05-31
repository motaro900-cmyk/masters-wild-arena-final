import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, '../public/assets/images/items');
const targetFolders = ['helms', 'armor', 'boots', 'shields', 'shoulders', 'pants', 'weapons'];

let deletedCount = 0;
let totalBytesSaved = 0;

targetFolders.forEach(folder => {
    const dirPath = path.join(baseDir, folder);
    if (!fs.existsSync(dirPath)) {
        console.log(`Directory ${folder} does not exist, skipping.`);
        return;
    }

    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        if (file.endsWith('.png')) {
            const pngPath = path.join(dirPath, file);
            const webpName = file.replace('.png', '.webp');
            const webpPath = path.join(dirPath, webpName);

            if (fs.existsSync(webpPath)) {
                const stats = fs.statSync(pngPath);
                totalBytesSaved += stats.size;
                fs.unlinkSync(pngPath);
                deletedCount++;
                console.log(`Deleted: ${path.join(folder, file)} (${(stats.size / 1024).toFixed(1)} KB)`);
            } else {
                console.warn(`⚠️ Skipped deletion of ${file} in ${folder} because no WebP version exists!`);
            }
        }
    });
});

console.log(`\n🎉 Process complete!`);
console.log(`Deleted files: ${deletedCount}`);
console.log(`Space saved: ${(totalBytesSaved / (1024 * 1024)).toFixed(2)} MB`);

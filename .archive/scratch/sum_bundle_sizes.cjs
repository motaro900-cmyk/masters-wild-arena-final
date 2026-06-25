const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assetsDir = 'dist/assets';
if (!fs.existsSync(assetsDir)) {
  console.error('Assets directory not found');
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);
let totalRaw = 0;
let totalGzip = 0;
const list = [];

files.forEach(file => {
  if (file.endsWith('.js')) {
    const fullPath = path.join(assetsDir, file);
    const content = fs.readFileSync(fullPath);
    const rawSize = content.length;
    const gzipSize = zlib.gzipSync(content).length;

    totalRaw += rawSize;
    totalGzip += gzipSize;

    list.push({
      file,
      rawSize: (rawSize / 1024).toFixed(2) + ' kB',
      gzipSize: (gzipSize / 1024).toFixed(2) + ' kB',
      rawBytes: rawSize,
      gzipBytes: gzipSize
    });
  }
});

list.sort((a, b) => b.rawBytes - a.rawBytes);

console.log('=== JS CHUNKS ===');
list.forEach(item => {
  console.log(`${item.file}: Raw: ${item.rawSize} | Gzip: ${item.gzipSize}`);
});

console.log('\n=== TOTAL JS SIZE ===');
console.log(`Raw: ${(totalRaw / 1024).toFixed(2)} kB (${totalRaw} bytes)`);
console.log(`Gzip: ${(totalGzip / 1024).toFixed(2)} kB (${totalGzip} bytes)`);

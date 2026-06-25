import fs from 'fs';
const content = fs.readFileSync('src/store/slices/battleSlice.ts', 'utf8').split('\n');
content.forEach((line, idx) => {
    if (line.includes('Ranked') || line.includes('ranked') || line.includes('rating') || line.includes('trophies')) {
        console.log(`${idx + 1}: ${line}`);
    }
});

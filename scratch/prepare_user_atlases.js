import fs from 'fs';
import path from 'path';

const characters = ['tiger_warrior', 'minotaur', 'lion_knight'];
const baseDir = 'assets-src/characters/';

function processCharacters() {
  characters.forEach(char => {
    const charDir = path.join(baseDir, char);
    const jsonPath = path.join(charDir, `${char}_poses.json`);
    const pngPath = path.join(charDir, `${char}_poses.png`);

    const destJsonPath = path.join(charDir, `${char}_poses.png.json`);
    const destPngPath = path.join(charDir, `${char}_poses.png.png`);

    console.log(`Processing ${char}...`);

    // 1. Update JSON pivots and image name
    if (fs.existsSync(jsonPath)) {
      const jsonRaw = fs.readFileSync(jsonPath, 'utf8');
      const atlas = JSON.parse(jsonRaw);

      // Set pivots to 0.5, 0.95 for feet anchor
      if (atlas.frames) {
        for (const frameName in atlas.frames) {
          atlas.frames[frameName].pivot = { x: 0.5, y: 0.95 };
        }
      }

      // Update image name in metadata
      if (atlas.meta) {
        atlas.meta.image = `${char}_poses.png.png`;
      }

      // Write updated JSON to the new double extension path
      fs.writeFileSync(destJsonPath, JSON.stringify(atlas, null, 2), 'utf8');
      console.log(`✓ Created JSON: ${destJsonPath}`);

      // Delete old single extension JSON file
      fs.unlinkSync(jsonPath);
      console.log(`✓ Removed old JSON: ${jsonPath}`);
    } else {
      console.log(`⚠ Warning: ${jsonPath} not found`);
    }

    // 2. Rename PNG file to double extension format
    if (fs.existsSync(pngPath)) {
      fs.renameSync(pngPath, destPngPath);
      console.log(`✓ Renamed PNG: ${pngPath} -> ${destPngPath}`);
    } else {
      // Check if it was already renamed
      if (fs.existsSync(destPngPath)) {
        console.log(`✓ PNG already has double extension: ${destPngPath}`);
      } else {
        console.log(`⚠ Warning: ${pngPath} not found`);
      }
    }
  });
  console.log('All character folder renaming and pivot adjustments completed.');
}

processCharacters();

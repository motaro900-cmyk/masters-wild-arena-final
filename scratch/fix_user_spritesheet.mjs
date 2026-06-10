import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PUBLIC_DIR = 'public/assets/characters/minotaur/';
const SRC_DIR = 'assets-src/characters/minotaur/';

async function main() {
  console.log('--- Aligning User-Exported Spritesheet ---');

  const userImgPath = path.join(PUBLIC_DIR, 'minotaur_poses.png');
  const userJsonPath = path.join(PUBLIC_DIR, 'minotaur_poses.json');
  const userBasePath = path.join(PUBLIC_DIR, 'minotaur_base.png');

  if (!fs.existsSync(userImgPath) || !fs.existsSync(userJsonPath)) {
    throw new Error('Could not find minotaur_poses.png or minotaur_poses.json in public minotaur folder!');
  }

  // 1. Copy files to assets-src
  console.log('Copying exported files to assets-src source directory...');
  fs.copyFileSync(userImgPath, path.join(SRC_DIR, 'minotaur_poses.png.png'));
  fs.copyFileSync(userBasePath, path.join(SRC_DIR, 'minotaur_base.png'));

  // 2. Read and parse JSON, renaming keys and correcting image path and pivots
  console.log('Reading and correcting JSON metadata...');
  const jsonRaw = fs.readFileSync(userJsonPath, 'utf8');
  const json = JSON.parse(jsonRaw);

  const updatedFrames = {};
  for (const [key, value] of Object.entries(json.frames)) {
    let newKey = key;
    // Map mismatched frame names to the game standards
    if (key === '6_hit.png') {
      newKey = '6_attack3.png';
      console.log('  Mapping: 6_hit.png -> 6_attack3.png');
    } else if (key === '7_attack4.png') {
      newKey = '7_death.png';
      console.log('  Mapping: 7_attack4.png -> 7_death.png');
    }

    // Correct pivot from center (0.5, 0.5) to feet (0.5, 0.95) so the model doesn't float
    value.pivot = { x: 0.5, y: 0.95 };

    updatedFrames[newKey] = value;
  }

  json.frames = updatedFrames;
  json.meta.image = 'minotaur_poses.png.png'; // Make sure it points to the double extension file

  // Write updated json to src folder
  fs.writeFileSync(
    path.join(SRC_DIR, 'minotaur_poses.png.json'),
    JSON.stringify(json, null, 2),
    'utf8'
  );
  console.log('Saved corrected JSON to assets-src.');

  // 3. Delete the temporary public files so they do not conflict
  console.log('Cleaning temporary public files...');
  fs.unlinkSync(userImgPath);
  fs.unlinkSync(userJsonPath);
  // Keep minotaur_base.png as it will be overwritten anyway during optimize

  console.log('Running optimize-assets build...');
  execSync('npm run optimize', { stdio: 'inherit' });
  console.log('Compilation finished successfully!');
}

main().catch(console.error);

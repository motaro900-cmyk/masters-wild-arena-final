import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const potionsDir = path.join(__dirname, '../public/assets/images/items/potions');

async function run() {
    console.log('🚀 Creating XP Potion assets by color-shifting existing potions...');

    // Small XP potion: base is hp_small.webp (red), shift hue to purple/magenta (around +125 degrees)
    await sharp(path.join(potionsDir, 'hp_small.webp'))
        .modulate({ hue: 125, saturation: 1.2 })
        .toFile(path.join(potionsDir, 'exp_small.webp'));
    console.log('✅ Created exp_small.webp');

    // Medium XP potion: base is speed.webp (yellowish/orange), shift hue to purple/magenta (around +250 degrees)
    await sharp(path.join(potionsDir, 'speed.webp'))
        .modulate({ hue: 250, saturation: 1.2 })
        .toFile(path.join(potionsDir, 'exp_medium.webp'));
    console.log('✅ Created exp_medium.webp');

    // Large XP potion: base is strength.webp (red with wings), shift hue to purple/magenta (around +125 degrees)
    await sharp(path.join(potionsDir, 'strength.webp'))
        .modulate({ hue: 125, saturation: 1.2 })
        .toFile(path.join(potionsDir, 'exp_large.webp'));
    console.log('✅ Created exp_large.webp');

    console.log('✨ XP potion assets successfully created!');
}

run().catch(console.error);

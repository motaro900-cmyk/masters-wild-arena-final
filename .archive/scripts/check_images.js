import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function checkImage(filePath) {
    try {
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) {
            console.log(`File: ${filePath} (NOT FOUND)`);
            return null;
        }
        const metadata = await sharp(fullPath).metadata();
        const sizeBytes = fs.statSync(fullPath).size;
        console.log(`File: ${filePath}`);
        console.log(`  Format: ${metadata.format}`);
        console.log(`  Dimensions: ${metadata.width}x${metadata.height}`);
        console.log(`  Size: ${(sizeBytes / 1024).toFixed(2)} KB`);
        console.log('---');
        return { filePath, metadata, sizeBytes };
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return null;
    }
}

async function run() {
    console.log('=== RESOURCE BAR ICONS ===');
    await checkImage('public/assets/images/ui/bar_gold.webp');
    await checkImage('public/assets/images/ui/bar_gem.webp');
    await checkImage('public/assets/images/ui/bar_energy.webp');
    await checkImage('public/assets/images/ui/hud_gold_bar.webp');
    await checkImage('public/assets/images/ui/hud_gem_bar.webp');

    console.log('=== BUTTONS ===');
    await checkImage('public/assets/images/ui/btn_normal.webp');
    await checkImage('public/assets/images/ui/btn_ranked_v2.webp');
    await checkImage('public/assets/images/ui/btn_ranked_v21.webp');
    await checkImage('public/assets/images/ui/btn_training.webp');
    await checkImage('public/assets/images/ui/battle_btn_group.webp');

    console.log('=== FRAMES & PLANELS ===');
    await checkImage('public/assets/images/ui/avatar_frame.png');
    await checkImage('public/assets/images/ui/avatar_frame.webp');
    await checkImage('public/assets/images/ui/Profilebar.png');
    await checkImage('public/assets/images/ui/Profilebar.webp');
    await checkImage('public/assets/images/ui/profilepanel.png');
    await checkImage('public/assets/images/ui/profilepanel.webp');
    await checkImage('public/assets/images/ui/profile_panel_full.webp');
    await checkImage('public/assets/images/ui/profile_plaque.webp');
    await checkImage('public/assets/images/ui/chat_panel_clean.png');
    await checkImage('public/assets/images/ui/chat_panel_clean.webp');
    await checkImage('public/assets/images/ui/sidebar_left1_full_v2.webp');
}

run();


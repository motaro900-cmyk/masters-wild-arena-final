import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseBrain = 'C:/Users/Motar/.gemini/antigravity/brain/045c5236-1f75-4df2-bce9-c36818f92404';
const destBase = path.join(__dirname, '../public/assets/images/items');

// Clean and create dirs
['shields', 'boots', 'armor'].forEach(dir => {
    const fullPath = path.join(destBase, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Sources
const shields = {
    'shield_lesnogo_strazha.webp': path.join(baseBrain, 'shield_lesnogo_strazha_1780229305665.png'),
    'bronzovyy_target.webp': path.join(baseBrain, 'bronzovyy_target_1780230065027.png'),
    'shield_ohotnika_na_trolley.webp': path.join(baseBrain, 'shield_ohotnika_na_trolley_1780230079765.png'),
    'runicheskiy_shield_gor.webp': path.join(baseBrain, 'runicheskiy_shield_gor_1780230093299.png'),
    'shield_kamennogo_golema.webp': path.join(baseBrain, 'shield_kamennogo_golema_1780229624247.png'),
    'barier_grozovogo_maga.webp': path.join(baseBrain, 'barier_grozovogo_maga_1780230108405.png'),
    'shield_pepelnogo_rycarya.webp': path.join(baseBrain, 'shield_pepelnogo_rycarya_1780230123411.png'),
    'shield_krovavoy_luny.webp': path.join(baseBrain, 'shield_krovavoy_luny_1780229673108.png'),
    'oplot_ledyanogo_korolya.webp': path.join(baseBrain, 'oplot_ledyanogo_korolya_1780230138361.png'),
};

const boots = {
    'kozhanye_porshni.webp': path.join(baseBrain, 'kozhanye_porshni_1780229863565.png'),
    'boots_bolotnogo_sledopyta.webp': path.join(baseBrain, 'boots_bolotnogo_sledopyta_1780229882972.png'),
    'sabatony_zheleznogo_legiona.webp': path.join(baseBrain, 'sabatony_zheleznogo_legiona_1780229900074.png'),
    'boots_grozovogo_vestnika.webp': path.join(baseBrain, 'boots_grozovogo_vestnika_1780229918391.png'),
    'botforty_pustotnogo_ohotnika.webp': path.join(baseBrain, 'botforty_pustotnogo_ohotnika_1780229937573.png'),
    'boots_nekromanta.webp': path.join(baseBrain, 'boots_nekromanta_1780229954553.png'),
    'sabatony_drakoney_cheshui.webp': path.join(baseBrain, 'sabatony_drakoney_cheshui_1780229970243.png'),
    'postup_zvezdnogo_skitalca.webp': path.join(baseBrain, 'postup_zvezdnogo_skitalca_1780229985787.png'),
};

// Base armor files to be manipulated
const srcTunic = path.join(baseBrain, 'tunika_lesnogo_uchenika_1780230152728.png');
const srcMageRobe = path.join(baseBrain, 'bronya_pepelnogo_maga_1780229689086.png');
const srcMilitia = path.join(baseBrain, 'steganyy_dospeh_opolchenca_1780230002789.png');
const srcCopper = path.join(baseBrain, 'kirasa_mednogo_straja_1780230018539.png');
const srcFlame = path.join(baseBrain, 'kirasa_vechnogo_plameni_1780229607365.png');

async function run() {
    console.log('🚀 Processing Shields...');
    for (const [name, srcPath] of Object.entries(shields)) {
        const dest = path.join(destBase, 'shields', name);
        await sharp(srcPath).webp({ quality: 85 }).toFile(dest);
        console.log(`✅ Processed Shield: ${name}`);
    }

    console.log('🚀 Processing Boots...');
    for (const [name, srcPath] of Object.entries(boots)) {
        const dest = path.join(destBase, 'boots', name);
        await sharp(srcPath).webp({ quality: 85 }).toFile(dest);
        console.log(`✅ Processed Boots: ${name}`);
    }

    console.log('🚀 Processing Armors...');
    
    // 1. Forest Tunic
    await sharp(srcTunic).webp({ quality: 85 }).toFile(path.join(destBase, 'armor', 'tunika_lesnogo_uchenika.webp'));
    console.log('✅ Armor: tunika_lesnogo_uchenika.webp (original)');

    // 2. Steganyy militia
    await sharp(srcMilitia).webp({ quality: 85 }).toFile(path.join(destBase, 'armor', 'steganyy_dospeh_opolchenca.webp'));
    console.log('✅ Armor: steganyy_dospeh_opolchenca.webp (original)');

    // 3. Copper Cuirass
    await sharp(srcCopper).webp({ quality: 85 }).toFile(path.join(destBase, 'armor', 'kirasa_mednogo_straja.webp'));
    console.log('✅ Armor: kirasa_mednogo_straja.webp (original)');

    // 4. Eternal Flame Cuirass
    await sharp(srcFlame).webp({ quality: 85 }).toFile(path.join(destBase, 'armor', 'kirasa_vechnogo_plameni.webp'));
    console.log('✅ Armor: kirasa_vechnogo_plameni.webp (original)');

    // 5. Ash Mage Robe (purple)
    await sharp(srcMageRobe).webp({ quality: 85 }).toFile(path.join(destBase, 'armor', 'bronya_pepelnogo_maga.webp'));
    console.log('✅ Armor: bronya_pepelnogo_maga.webp (original)');

    // 6. River Pirate Leather: Take Forest Tunic, shift hue to brown/darker orange, lower brightness
    await sharp(srcTunic)
        .modulate({ hue: 35, saturation: 0.7, brightness: 0.6 })
        .webp({ quality: 85 })
        .toFile(path.join(destBase, 'armor', 'dospeh_rechnogo_pirata.webp'));
    console.log('🎨 Armor: dospeh_rechnogo_pirata.webp (modified - leather/brown tone)');

    // 7. Swamp Troll Carapace: Take Mage Robe (purple), hue shift by 140 (becomes vibrant green), increase contrast/brightness slightly
    await sharp(srcMageRobe)
        .modulate({ hue: 140, saturation: 1.1, brightness: 0.95 })
        .webp({ quality: 85 })
        .toFile(path.join(destBase, 'armor', 'pancir_bolotnogo_trollya.webp'));
    console.log('🎨 Armor: pancir_bolotnogo_trollya.webp (modified - swamp green carapace)');

    // 8. Stone Guardian Plates: Take Flame Cuirass, desaturate to gray, tint gray/stone, slightly decrease brightness
    await sharp(srcFlame)
        .greyscale()
        .modulate({ brightness: 0.7, saturation: 0.1 })
        .webp({ quality: 85 })
        .toFile(path.join(destBase, 'armor', 'laty_kamennogo_straja.webp'));
    console.log('🎨 Armor: laty_kamennogo_straja.webp (modified - grey stone texture)');

    // 9. Thunder Titan Plate: Take Flame Cuirass, shift hue by 200 (becomes bright storm blue), increase brightness/saturation slightly
    await sharp(srcFlame)
        .modulate({ hue: 200, saturation: 1.3, brightness: 1.1 })
        .webp({ quality: 85 })
        .toFile(path.join(destBase, 'armor', 'dospeh_grozovogo_titana.webp'));
    console.log('🎨 Armor: dospeh_grozovogo_titana.webp (modified - thunder storm blue)');

    // 10. Bone Reaper: Take Mage Robe (purple), desaturate, hue shift to yellow/creamy bone white, increase brightness
    await sharp(srcMageRobe)
        .modulate({ hue: 60, saturation: 0.3, brightness: 1.2 })
        .webp({ quality: 85 })
        .toFile(path.join(destBase, 'armor', 'bronya_kostyanogo_jneca.webp'));
    console.log('🎨 Armor: bronya_kostyanogo_jneca.webp (modified - bone white robe)');

    console.log('✨ All assets distributed and optimized successfully!');
}

run().catch(console.error);

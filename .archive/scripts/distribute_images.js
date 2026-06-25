import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcShield = 'C:/Users/Motar/.gemini/antigravity/brain/045c5236-1f75-4df2-bce9-c36818f92404/shield_lesnogo_strazha_1780229305665.png';
const srcBoots = 'C:/Users/Motar/.gemini/antigravity/brain/045c5236-1f75-4df2-bce9-c36818f92404/kozhanye_porshni_1780229321370.png';
const srcArmor = 'C:/Users/Motar/.gemini/antigravity/brain/045c5236-1f75-4df2-bce9-c36818f92404/tunika_lesnogo_uchenika_1780229335745.png';

const destBase = path.join(__dirname, '../public/assets/images/items');

const shields = [
    'shield_lesnogo_strazha.webp',
    'bronzovyy_target.webp',
    'shield_ohotnika_na_trolley.webp',
    'runicheskiy_shield_gor.webp',
    'shield_kamennogo_golema.webp',
    'barier_grozovogo_maga.webp',
    'shield_pepelnogo_rycarya.webp',
    'shield_krovavoy_luny.webp',
    'oplot_ledyanogo_korolya.webp'
];

const boots = [
    'kozhanye_porshni.webp',
    'boots_bolotnogo_sledopyta.webp',
    'sabatony_zheleznogo_legiona.webp',
    'boots_grozovogo_vestnika.webp',
    'botforty_pustotnogo_ohotnika.webp',
    'boots_nekromanta.webp',
    'sabatony_drakoney_cheshui.webp',
    'postup_zvezdnogo_skitalca.webp'
];

const armors = [
    'tunika_lesnogo_uchenika.webp',
    'steganyy_dospeh_opolchenca.webp',
    'kirasa_mednogo_straja.webp',
    'dospeh_rechnogo_pirata.webp',
    'pancir_bolotnogo_trollya.webp',
    'bronya_pepelnogo_maga.webp',
    'laty_kamennogo_straja.webp',
    'dospeh_grozovogo_titana.webp',
    'bronya_kostyanogo_jneca.webp',
    'kirasa_vechnogo_plameni.webp'
];

async function run() {
    // 1. Process shields
    const shieldWebpPath = path.join(__dirname, 'temp_shield.webp');
    await sharp(srcShield).webp({ quality: 85 }).toFile(shieldWebpPath);
    for (const name of shields) {
        const dest = path.join(destBase, 'shields', name);
        fs.copyFileSync(shieldWebpPath, dest);
        console.log(`Copied shield to: ${dest}`);
    }
    fs.unlinkSync(shieldWebpPath);

    // 2. Process boots
    const bootsWebpPath = path.join(__dirname, 'temp_boots.webp');
    await sharp(srcBoots).webp({ quality: 85 }).toFile(bootsWebpPath);
    for (const name of boots) {
        const dest = path.join(destBase, 'boots', name);
        fs.copyFileSync(bootsWebpPath, dest);
        console.log(`Copied boots to: ${dest}`);
    }
    fs.unlinkSync(bootsWebpPath);

    // 3. Process armor
    const armorWebpPath = path.join(__dirname, 'temp_armor.webp');
    await sharp(srcArmor).webp({ quality: 85 }).toFile(armorWebpPath);
    for (const name of armors) {
        const dest = path.join(destBase, 'armor', name);
        fs.copyFileSync(armorWebpPath, dest);
        console.log(`Copied armor to: ${dest}`);
    }
    fs.unlinkSync(armorWebpPath);

    console.log('🎉 Done distributing assets!');
}

run().catch(console.error);

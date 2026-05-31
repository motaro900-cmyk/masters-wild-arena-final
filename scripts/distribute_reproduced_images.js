import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseBrain = 'C:/Users/Motar/.gemini/antigravity/brain/045c5236-1f75-4df2-bce9-c36818f92404';

// Original PNG files generated
const assets = {
    shield_wood: path.join(baseBrain, 'shield_lesnogo_strazha_1780229305665.png'),
    boots_simple: path.join(baseBrain, 'kozhanye_porshni_1780229321370.png'),
    armor_simple: path.join(baseBrain, 'tunika_lesnogo_uchenika_1780229335745.png'),
    armor_mythic: path.join(baseBrain, 'kirasa_vechnogo_plameni_1780229607365.png'),
    shield_stone: path.join(baseBrain, 'shield_kamennogo_golema_1780229624247.png'),
    boots_swamp: path.join(baseBrain, 'boots_bolotnogo_sledopyta_1780229639785.png'),
    boots_thunder: path.join(baseBrain, 'boots_grozovogo_vestnika_1780229658270.png'),
    shield_blood: path.join(baseBrain, 'shield_krovavoy_luny_1780229673108.png'),
    armor_mage: path.join(baseBrain, 'bronya_pepelnogo_maga_1780229689086.png'),
};

const destBase = path.join(__dirname, '../public/assets/images/items');

const shieldMapping = {
    'shield_lesnogo_strazha.webp': 'shield_wood',
    'bronzovyy_target.webp': 'shield_wood',
    'shield_ohotnika_na_trolley.webp': 'shield_wood',
    'runicheskiy_shield_gor.webp': 'shield_stone',
    'shield_kamennogo_golema.webp': 'shield_stone',
    'barier_grozovogo_maga.webp': 'shield_blood',
    'shield_pepelnogo_rycarya.webp': 'shield_stone',
    'shield_krovavoy_luny.webp': 'shield_blood',
    'oplot_ledyanogo_korolya.webp': 'shield_stone'
};

const bootsMapping = {
    'kozhanye_porshni.webp': 'boots_simple',
    'boots_bolotnogo_sledopyta.webp': 'boots_swamp',
    'sabatony_zheleznogo_legiona.webp': 'boots_thunder',
    'boots_grozovogo_vestnika.webp': 'boots_thunder',
    'botforty_pustotnogo_ohotnika.webp': 'boots_swamp',
    'boots_nekromanta.webp': 'boots_thunder',
    'sabatony_drakoney_cheshui.webp': 'boots_thunder',
    'postup_zvezdnogo_skitalca.webp': 'boots_thunder'
};

const armorMapping = {
    'tunika_lesnogo_uchenika.webp': 'armor_simple',
    'steganyy_dospeh_opolchenca.webp': 'armor_simple',
    'kirasa_mednogo_straja.webp': 'armor_mythic',
    'dospeh_rechnogo_pirata.webp': 'armor_simple',
    'pancir_bolotnogo_trollya.webp': 'armor_mage',
    'bronya_pepelnogo_maga.webp': 'armor_mage',
    'laty_kamennogo_straja.webp': 'armor_mythic',
    'dospeh_grozovogo_titana.webp': 'armor_mythic',
    'bronya_kostyanogo_jneca.webp': 'armor_mage',
    'kirasa_vechnogo_plameni.webp': 'armor_mythic'
};

async function processMapping(mapping, subDir) {
    // Compile webps to temp path
    const tempWebp = {};
    for (const [key, pngPath] of Object.entries(assets)) {
        const tempPath = path.join(__dirname, `temp_${key}.webp`);
        await sharp(pngPath).webp({ quality: 85 }).toFile(tempPath);
        tempWebp[key] = tempPath;
    }

    // Copy to destinations
    for (const [destName, assetKey] of Object.entries(mapping)) {
        const srcPath = tempWebp[assetKey];
        const destPath = path.join(destBase, subDir, destName);
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Distributed ${subDir}/${destName} using ${assetKey}`);
    }

    // Cleanup
    for (const tempPath of Object.values(tempWebp)) {
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
}

async function run() {
    console.log('🚀 Starting distribution of customized item sprites...');
    await processMapping(shieldMapping, 'shields');
    await processMapping(bootsMapping, 'boots');
    await processMapping(armorMapping, 'armor');
    console.log('✨ Distribution complete!');
}

run().catch(console.error);

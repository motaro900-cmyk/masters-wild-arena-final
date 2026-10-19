const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('=== STARTING ASSET INTEGRITY AUDIT ===\n');

// 1. Audit Fonts
console.log('--- 1. AUDITING FONTS ---');
const fontsCssPath = path.join(PUBLIC_DIR, 'assets/fonts/fonts.css');
if (fs.existsSync(fontsCssPath)) {
    const cssContent = fs.readFileSync(fontsCssPath, 'utf8');
    const families = new Set();
    const familyRegex = /font-family:\s*['"]?([^'";]+)['"]?/g;
    let m;
    while ((m = familyRegex.exec(cssContent)) !== null) {
        families.add(m[1].trim());
    }
    console.log('Font families defined in fonts.css:', Array.from(families));

    const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
    const fontUrls = [];
    while ((m = urlRegex.exec(cssContent)) !== null) {
        fontUrls.push(m[1]);
    }
    console.log(`Total @font-face url() references in fonts.css: ${fontUrls.length}`);

    let missingFontFiles = 0;
    fontUrls.forEach((url) => {
        // e.g. /assets/fonts/filename.woff2 or ./filename.woff2
        const cleanPath = url.replace(/^\.?\/assets\/fonts\//, '').replace(/^\.\//, '');
        const fullPublicFont = path.join(PUBLIC_DIR, 'assets/fonts', cleanPath);
        const fullDistFont = path.join(DIST_DIR, 'assets/fonts', cleanPath);
        if (!fs.existsSync(fullPublicFont)) {
            console.error(`❌ Missing in public: ${fullPublicFont}`);
            missingFontFiles++;
        }
        if (!fs.existsSync(fullDistFont)) {
            console.error(`❌ Missing in dist: ${fullDistFont}`);
            missingFontFiles++;
        }
    });
    if (missingFontFiles === 0) {
        console.log(`✅ All ${fontUrls.length} font woff2 files exist in public/ and dist/!`);
    }

    // Check fonts-secondary.css
    const secondaryCssPath = path.join(PUBLIC_DIR, 'assets/fonts/fonts-secondary.css');
    console.log('Does fonts-secondary.css exist in public?', fs.existsSync(secondaryCssPath));
} else {
    console.error('❌ fonts.css not found at', fontsCssPath);
}

// 2. Audit Character Assets
console.log('\n--- 2. AUDITING CHARACTER ASSETS ---');
const characters = ['panda', 'raccoon', 'minotaur', 'tiger_warrior', 'lion_knight', 'ancients'];
characters.forEach(char => {
    const pubCharDir = path.join(PUBLIC_DIR, 'assets/characters', char);
    const distCharDir = path.join(DIST_DIR, 'assets/characters', char);
    console.log(`Checking character [${char}]:`);
    if (fs.existsSync(pubCharDir)) {
        const pubFiles = fs.readdirSync(pubCharDir);
        console.log(`  public (${pubFiles.length} files):`, pubFiles.join(', '));
    } else {
        console.error(`  ❌ Missing in public: ${pubCharDir}`);
    }
    if (fs.existsSync(distCharDir)) {
        const distFiles = fs.readdirSync(distCharDir);
        console.log(`  dist (${distFiles.length} files):`, distFiles.join(', '));
    } else {
        console.error(`  ❌ Missing in dist: ${distCharDir}`);
    }
});

// 3. Audit Item Atlases and Sprites
console.log('\n--- 3. AUDITING ITEM ATLASES AND SPRITES ---');
const atlasFiles = [
    'assets/images/items/weapons/items.webp',
    'assets/images/items/weapons/items_mobile.webp',
    'assets/images/items/weapons/items.json',
    'assets/images/items/weapons/items_mobile.json'
];
atlasFiles.forEach(rel => {
    const pub = path.join(PUBLIC_DIR, rel);
    const dist = path.join(DIST_DIR, rel);
    console.log(`Atlas ${rel}:`);
    console.log(`  public exists: ${fs.existsSync(pub)} (${fs.existsSync(pub) ? fs.statSync(pub).size : 0} bytes)`);
    console.log(`  dist exists:   ${fs.existsSync(dist)} (${fs.existsSync(dist) ? fs.statSync(dist).size : 0} bytes)`);
});

// 4. Audit AssetsMap URLs
console.log('\n--- 4. AUDITING ASSETSMAP.TS URLS ---');
const assetsMapPath = path.join(ROOT_DIR, 'src/configs/AssetsMap.ts');
const assetsMapContent = fs.readFileSync(assetsMapPath, 'utf8');

// Extract all string literals matching /assets/...
const assetMatches = assetsMapContent.match(/'\/assets\/[^']+'/g) || [];
const uniqueAssets = Array.from(new Set(assetMatches.map(s => s.replace(/'/g, ''))));

console.log(`Found ${uniqueAssets.length} unique asset paths in AssetsMap.ts.`);
let missingMapPublic = 0;
let missingMapDist = 0;

uniqueAssets.forEach(assetPath => {
    // Normal asset path relative to public/ or dist/
    const rel = assetPath.replace(/^\//, '');
    const pub = path.join(PUBLIC_DIR, rel);
    const dist = path.join(DIST_DIR, rel);
    const pubExists = fs.existsSync(pub);
    const distExists = fs.existsSync(dist);

    if (!pubExists) {
        console.error(`❌ AssetsMap missing in public: ${assetPath}`);
        missingMapPublic++;
    }
    if (!distExists) {
        console.error(`❌ AssetsMap missing in dist: ${assetPath}`);
        missingMapDist++;
    }
});

console.log(`AssetsMap audit summary: Missing in public: ${missingMapPublic}, Missing in dist: ${missingMapDist}`);

// 5. Audit HeroesConfig.ts and SkinsConfig.ts
console.log('\n--- 5. AUDITING ACTIVE HEROESCONFIG & SKINSCONFIG ---');
['src/configs/HeroesConfig.ts', 'src/configs/SkinsConfig.ts'].forEach(cfg => {
    let content = fs.readFileSync(path.join(ROOT_DIR, cfg), 'utf8');
    // Strip block comments (/* ... */)
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    const matches = content.match(/'\/assets\/[^']+'/g) || [];
    const unique = Array.from(new Set(matches.map(s => s.replace(/'/g, ''))));
    console.log(`In ${cfg}: found ${unique.length} active assets:`);
    unique.forEach(u => {
        const rel = u.replace(/^\//, '');
        const pub = path.join(PUBLIC_DIR, rel);
        const dist = path.join(DIST_DIR, rel);
        if (!fs.existsSync(pub) || !fs.existsSync(dist)) {
            console.error(`❌ ${cfg} asset missing: ${u} (pub: ${fs.existsSync(pub)}, dist: ${fs.existsSync(dist)})`);
        } else {
            console.log(`  ✅ ${u}`);
        }
    });
});

console.log('\n=== AUDIT COMPLETE ===');

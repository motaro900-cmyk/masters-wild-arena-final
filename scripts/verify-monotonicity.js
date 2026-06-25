import fs from 'fs';
import path from 'path';

async function verifyCategory(category) {
    const filename = `${category}.ts`;
    const filepath = path.join(process.cwd(), 'src/game/configs/items', filename);
    
    let content = fs.readFileSync(filepath, 'utf8');
    let jsContent = content
        .replace(/import\s+\{\s*IEquipmentStats\s*\}\s+from\s+['"]\.\/types['"];?/g, '')
        .replace(/:Record<string,\s*IEquipmentStats>/g, '')
        .replace(/: Record<string,\s*IEquipmentStats>/g, '');
        
    const tempFilepath = path.join(process.cwd(), `scripts/temp_verify_${category}.js`);
    fs.writeFileSync(tempFilepath, jsContent, 'utf8');
    
    const imported = await import(`file://${tempFilepath}`);
    const dataObj = imported[category];
    fs.unlinkSync(tempFilepath);
    
    const items = Object.values(dataObj);
    
    // 1. Verify levels are sorted and unique
    for (let i = 1; i < items.length; i++) {
        if ((items[i].requiredLevel || 1) <= (items[i - 1].requiredLevel || 1)) {
            throw new Error(`[${category}] Levels not strictly increasing: ${items[i-1].id} (lvl ${items[i-1].requiredLevel}) vs ${items[i].id} (lvl ${items[i].requiredLevel})`);
        }
    }
    
    // 2. Verify stats are strictly increasing
    for (let i = 1; i < items.length; i++) {
        const prev = items[i - 1];
        const curr = items[i];
        
        if (curr.attackBonus !== undefined && prev.attackBonus !== undefined) {
            if (curr.attackBonus <= prev.attackBonus) {
                throw new Error(`[${category}] attackBonus not increasing: ${prev.id} (${prev.attackBonus}) vs ${curr.id} (${curr.attackBonus})`);
            }
        }
        if (curr.defenseBonus !== undefined && prev.defenseBonus !== undefined) {
            if (curr.defenseBonus <= prev.defenseBonus) {
                throw new Error(`[${category}] defenseBonus not increasing: ${prev.id} (${prev.defenseBonus}) vs ${curr.id} (${curr.defenseBonus})`);
            }
        }
        if (curr.hpBonus !== undefined && prev.hpBonus !== undefined) {
            if (curr.hpBonus <= prev.hpBonus) {
                throw new Error(`[${category}] hpBonus not increasing: ${prev.id} (${prev.hpBonus}) vs ${curr.id} (${curr.hpBonus})`);
            }
        }
    }
    
    // 3. Verify currency alternation and strictly increasing price lists
    let lastGoldPrice = 0;
    let lastGemPrice = 0;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (i % 2 === 0) {
            // Gold
            if (item.priceGold === undefined || item.priceGem !== undefined) {
                throw new Error(`[${category}] Currency alternation mismatch at index ${i} for ${item.id}: expected Gold, got Gem`);
            }
            if (item.priceGold <= lastGoldPrice) {
                throw new Error(`[${category}] Gold price not increasing: ${item.id} (${item.priceGold}) vs previous Gold (${lastGoldPrice})`);
            }
            lastGoldPrice = item.priceGold;
        } else {
            // Gems
            if (item.priceGem === undefined || item.priceGold !== undefined) {
                throw new Error(`[${category}] Currency alternation mismatch at index ${i} for ${item.id}: expected Gem, got Gold`);
            }
            if (item.priceGem <= lastGemPrice) {
                throw new Error(`[${category}] Gem price not increasing: ${item.id} (${item.priceGem}) vs previous Gem (${lastGemPrice})`);
            }
            lastGemPrice = item.priceGem;
        }
    }
    
    console.log(`[PASS] ${category}: verified successfully.`);
}

async function main() {
    const categories = ['weapons', 'shields', 'armor', 'helmets', 'pants', 'boots', 'shoulders'];
    for (let cat of categories) {
        await verifyCategory(cat);
    }
    console.log('All verification checks passed perfectly!');
}

main().catch(err => {
    console.error('[FAIL] Monotonicity check failed:', err.message);
    process.exit(1);
});

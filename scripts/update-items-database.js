import fs from 'fs';
import path from 'path';

// Piecewise pricing logic
function getGemPrice(L) {
    let raw = 0;
    if (L <= 10) {
        raw = 50 + (L - 1) * 15;
    } else if (L <= 25) {
        raw = 200 + (L - 10) * 30;
    } else if (L <= 46) {
        raw = 700 + (L - 25) * 80;
    } else {
        raw = 2400 + (L - 46) * 20;
    }
    
    if (raw < 50) {
        return Math.round(raw / 5) * 5;
    } else if (raw < 200) {
        return Math.round(raw / 10) * 10;
    } else if (raw < 1000) {
        return Math.round(raw / 50) * 50;
    } else {
        return Math.round(raw / 100) * 100;
    }
}

function getGoldPrice(L) {
    let raw = 0;
    if (L <= 10) {
        raw = 1000 + (L - 1) * 400;
    } else if (L <= 25) {
        raw = 5000 + (L - 10) * 2000;
    } else if (L <= 46) {
        raw = 35000 + (L - 25) * 3000;
    } else {
        raw = 100000 + (L - 46) * 2500;
    }
    
    if (raw < 100) {
        return Math.round(raw / 10) * 10;
    } else if (raw < 500) {
        return Math.round(raw / 50) * 50;
    } else if (raw < 2000) {
        return Math.round(raw / 100) * 100;
    } else if (raw < 10000) {
        return Math.round(raw / 500) * 500;
    } else {
        return Math.round(raw / 1000) * 1000;
    }
}

const MULTIPLIERS = {
    weapons: 1.0,
    armor: 0.8,
    helmets: 0.7,
    shields: 0.65,
    pants: 0.6,
    shoulders: 0.55,
    boots: 0.5
};

const STAT_RANGES = {
    weapons: {
        attackBonus: { min: 32, max: 840 }
    },
    shields: {
        defenseBonus: { min: 9, max: 252 }
    },
    armor: {
        defenseBonus: { min: 7, max: 196 }
    },
    helmets: {
        defenseBonus: { min: 8, max: 224 }
    },
    pants: {
        hpBonus: { min: 89, max: 2380 }
    },
    boots: {
        defenseBonus: { min: 5, max: 140 }
    },
    shoulders: {
        attackBonus: { min: 9, max: 84 },
        defenseBonus: { min: 14, max: 140 }
    }
};

function serializeItem(item) {
    const lines = [];
    lines.push(`    ${item.id}: {`);
    lines.push(`        id: '${item.id}',`);
    lines.push(`        name: '${item.name}',`);
    lines.push(`        requiredLevel: ${item.requiredLevel},`);
    lines.push(`        rarity: '${item.rarity}',`);
    if (item.attackBonus !== undefined) lines.push(`        attackBonus: ${item.attackBonus},`);
    if (item.defenseBonus !== undefined) lines.push(`        defenseBonus: ${item.defenseBonus},`);
    if (item.hpBonus !== undefined) lines.push(`        hpBonus: ${item.hpBonus},`);
    if (item.speedBonus !== undefined) lines.push(`        speedBonus: ${item.speedBonus},`);
    if (item.critBonus !== undefined) lines.push(`        critBonus: ${item.critBonus},`);
    if (item.priceGold !== undefined) lines.push(`        priceGold: ${item.priceGold},`);
    if (item.priceGem !== undefined) lines.push(`        priceGem: ${item.priceGem},`);
    lines.push(`        image: '${item.image}',`);
    if (item.atlasFrame !== undefined) lines.push(`        atlasFrame: '${item.atlasFrame}',`);
    lines.push(`        mainTab: '${item.mainTab}',`);
    lines.push(`        subTab: '${item.subTab}',`);
    lines.push(`        desc: '${item.desc.replace(/'/g, "\\'")}',`);
    if (item.textureKey !== undefined) lines.push(`        textureKey: '${item.textureKey}',`);
    lines.push(`    },`);
    return lines.join('\n');
}

async function processFile(category) {
    const filename = `${category}.ts`;
    const filepath = path.join(process.cwd(), 'src/game/configs/items', filename);
    console.log(`Processing file: ${filename}`);
    
    // 1. Read TS file
    let content = fs.readFileSync(filepath, 'utf8');
    
    // 2. Convert to JS by stripping TS annotations
    let jsContent = content
        .replace(/import\s+\{\s*IEquipmentStats\s*\}\s+from\s+['"]\.\/types['"];?/g, '')
        .replace(/:Record<string,\s*IEquipmentStats>/g, '')
        .replace(/: Record<string,\s*IEquipmentStats>/g, '');
        
    const tempFilepath = path.join(process.cwd(), `scripts/temp_${category}.js`);
    fs.writeFileSync(tempFilepath, jsContent, 'utf8');
    
    // 3. Import dynamically
    const imported = await import(`file://${tempFilepath}`);
    const dataObj = imported[category];
    if (!dataObj) {
        throw new Error(`Could not find exported object '${category}' in temp file`);
    }
    
    // Clean up temp file
    fs.unlinkSync(tempFilepath);
    
    // 4. Convert Record to Array and sort by requiredLevel
    const items = Object.values(dataObj);
    items.sort((a, b) => (a.requiredLevel || 1) - (b.requiredLevel || 1));
    
    // Find min and max levels
    const levels = items.map(item => item.requiredLevel || 1);
    const minL = Math.min(...levels);
    const maxL = Math.max(...levels);
    
    const mult = MULTIPLIERS[category] || 1.0;
    const ranges = STAT_RANGES[category] || {};
    
    // 5. Update stats monotonically
    for (let item of items) {
        const L = item.requiredLevel || 1;
        const P = maxL === minL ? 0 : (L - minL) / (maxL - minL);
        const P_scaled = Math.pow(P, 1.25); // power curve
        
        if (ranges.attackBonus) {
            const { min, max } = ranges.attackBonus;
            item.attackBonus = min + Math.round((max - min) * P_scaled);
        }
        if (ranges.defenseBonus) {
            const { min, max } = ranges.defenseBonus;
            item.defenseBonus = min + Math.round((max - min) * P_scaled);
        }
        if (ranges.hpBonus) {
            const { min, max } = ranges.hpBonus;
            item.hpBonus = min + Math.round((max - min) * P_scaled);
        } else if (item.defenseBonus !== undefined) {
            // HP bonus derived from defense
            const hpFactor = category === 'boots' ? 11 : 10;
            item.hpBonus = item.defenseBonus * hpFactor;
        }
    }
    
    // Enforce strictly increasing stats
    for (let j = 1; j < items.length; j++) {
        const prev = items[j - 1];
        const curr = items[j];
        if (curr.attackBonus !== undefined && prev.attackBonus !== undefined) {
            if (curr.attackBonus <= prev.attackBonus) {
                curr.attackBonus = prev.attackBonus + 1;
            }
        }
        if (curr.defenseBonus !== undefined && prev.defenseBonus !== undefined) {
            if (curr.defenseBonus <= prev.defenseBonus) {
                curr.defenseBonus = prev.defenseBonus + 1;
            }
        }
        if (curr.hpBonus !== undefined && prev.hpBonus !== undefined) {
            if (curr.hpBonus <= prev.hpBonus) {
                const step = curr.defenseBonus !== undefined ? 10 : 5;
                curr.hpBonus = prev.hpBonus + step;
            }
        }
    }
    
    // 6. Update pricing and alternate currency
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const L = item.requiredLevel || 1;
        
        if (i % 2 === 0) {
            // Gold item
            delete item.priceGem;
            let rawGold = getGoldPrice(L) * mult;
            if (rawGold < 100) {
                item.priceGold = Math.round(rawGold / 10) * 10;
            } else if (rawGold < 500) {
                item.priceGold = Math.round(rawGold / 50) * 50;
            } else if (rawGold < 2000) {
                item.priceGold = Math.round(rawGold / 100) * 100;
            } else if (rawGold < 10000) {
                item.priceGold = Math.round(rawGold / 500) * 500;
            } else {
                item.priceGold = Math.round(rawGold / 1000) * 1000;
            }
        } else {
            // Gem item
            delete item.priceGold;
            let rawGem = getGemPrice(L) * mult;
            if (rawGem < 50) {
                item.priceGem = Math.round(rawGem / 5) * 5;
            } else if (rawGem < 200) {
                item.priceGem = Math.round(rawGem / 10) * 10;
            } else if (rawGem < 1000) {
                item.priceGem = Math.round(rawGem / 50) * 50;
            } else {
                item.priceGem = Math.round(rawGem / 100) * 100;
            }
        }
    }
    
    // Enforce strictly increasing prices per currency
    let lastGoldPrice = 0;
    for (let j = 0; j < items.length; j++) {
        if (items[j].priceGold !== undefined) {
            if (items[j].priceGold <= lastGoldPrice) {
                items[j].priceGold = Math.max(lastGoldPrice + 10, Math.ceil(lastGoldPrice * 1.1 / 10) * 10);
            }
            lastGoldPrice = items[j].priceGold;
        }
    }
    let lastGemPrice = 0;
    for (let j = 0; j < items.length; j++) {
        if (items[j].priceGem !== undefined) {
            if (items[j].priceGem <= lastGemPrice) {
                items[j].priceGem = Math.max(lastGemPrice + 1, Math.ceil(lastGemPrice * 1.1));
            }
            lastGemPrice = items[j].priceGem;
        }
    }
    
    // 7. Serialize back to TS format
    const serializedItems = items.map(serializeItem).join('\n\n');
    const newContent = `import { IEquipmentStats } from './types';

export const ${category}: Record<string, IEquipmentStats> = {
${serializedItems}
};
`;
    
    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log(`Successfully updated ${filename}`);
}

async function main() {
    const categories = ['weapons', 'shields', 'armor', 'helmets', 'pants', 'boots', 'shoulders'];
    for (let cat of categories) {
        await processFile(cat);
    }
    console.log('All categories successfully processed.');
}

main().catch(err => {
    console.error('Error running update script:', err);
    process.exit(1);
});

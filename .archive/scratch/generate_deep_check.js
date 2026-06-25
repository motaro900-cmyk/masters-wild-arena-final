import fs from 'fs';
import path from 'path';

// Define helper for item power calculation matching the actual code in src/game/configs/items/itemUtils.ts
const calculateItemPower = (item) => {
    if (!item) return 0;
    const power = 
        (item.attackBonus || 0) * 2.0 +
        (item.defenseBonus || 0) * 1.5 +
        (item.hpBonus || 0) * 0.1 +
        (item.critBonus || 0) * 300 +
        (item.speedBonus || 0) * 100;
    return Math.round(power);
};

const itemsDir = 'src/game/configs/items';

function parseFile(fileName) {
    const filePath = path.join(itemsDir, fileName);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l => l.replace('\r', ''));
    
    const items = [];
    let currentItem = null;
    let currentLines = [];
    
    for (let line of lines) {
        const startMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*\{\s*$/);
        if (startMatch) {
            currentItem = startMatch[1];
            currentLines = [];
            continue;
        }
        
        if (currentItem && line.match(/^\s*\}\s*,\s*$/)) {
            const body = currentLines.join('\n');
            const nameMatch = body.match(/name\s*:\s*['"`](.*?)['"`]/);
            const rarityMatch = body.match(/rarity\s*:\s*(?:ItemRarity\.)?['"`]?([A-Za-z0-9_]+)['"`]?/);
            const reqLvlMatch = body.match(/requiredLevel\s*:\s*(\d+)/);
            
            const atkMatch = body.match(/attackBonus\s*:\s*([-0-9.]+)/);
            const defMatch = body.match(/defenseBonus\s*:\s*([-0-9.]+)/);
            const hpMatch = body.match(/hpBonus\s*:\s*([-0-9.]+)/);
            const spdMatch = body.match(/speedBonus\s*:\s*([-0-9.]+)/);
            const critMatch = body.match(/critBonus\s*:\s*([-0-9.]+)/);
            
            if (rarityMatch && reqLvlMatch) {
                const name = nameMatch ? nameMatch[1] : currentItem;
                let rarity = rarityMatch[1];
                if (rarity.startsWith('ItemRarity.')) {
                    rarity = rarity.replace('ItemRarity.', '');
                }
                const requiredLevel = parseInt(reqLvlMatch[1], 10);
                
                const stats = {};
                if (atkMatch) stats.attackBonus = parseFloat(atkMatch[1]);
                if (defMatch) stats.defenseBonus = parseFloat(defMatch[1]);
                if (hpMatch) stats.hpBonus = parseFloat(hpMatch[1]);
                if (spdMatch) stats.speedBonus = parseFloat(spdMatch[1]);
                if (critMatch) stats.critBonus = parseFloat(critMatch[1]);
                
                const power = calculateItemPower(stats);
                items.push({ id: currentItem, name, rarity, requiredLevel, stats, power });
            }
            currentItem = null;
            continue;
        }
        
        if (currentItem) {
            currentLines.push(line);
        }
    }
    
    return items;
}

const slots = ['weapons', 'helmets', 'armor', 'shields', 'shoulders', 'pants', 'boots'];
let out = '';

slots.forEach(slot => {
    out += `\n### Слот: ${slot.toUpperCase()}\n`;
    const items = parseFile(`${slot}.ts`);
    
    // Find:
    // 1. Items with same requiredLevel in the slot
    // 2. Items where level is lower but power is higher
    // 3. Items where level is lower but any stat is higher (or same)
    
    // Sort by requiredLevel first
    items.sort((a, b) => a.requiredLevel - b.requiredLevel);
    
    // Group by level
    const lvlGroups = {};
    items.forEach(item => {
        if (!lvlGroups[item.requiredLevel]) lvlGroups[item.requiredLevel] = [];
        lvlGroups[item.requiredLevel].push(item);
    });
    
    out += `* **Предметы с одинаковым уровнем в слоте:**\n`;
    let foundSameLvl = false;
    Object.keys(lvlGroups).forEach(lvl => {
        if (lvlGroups[lvl].length > 1) {
            foundSameLvl = true;
            const itemDescs = lvlGroups[lvl].map(it => `\`${it.id}\` (${it.name}, ${it.rarity}, Мощь ${it.power})`);
            out += `  - Уровень ${lvl}: ${itemDescs.join(', ')}\n`;
        }
    });
    if (!foundSameLvl) out += `  - Нет\n`;
    
    out += `* **Аномалии: Уровень ниже, но мощь или статы выше:**\n`;
    let foundAnomalies = false;
    
    for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < items.length; j++) {
            if (i === j) continue;
            const a = items[i]; // higher level
            const b = items[j]; // lower level
            
            if (b.requiredLevel < a.requiredLevel) {
                // b is lower level than a. Let's see if b is stronger or has higher stats.
                let isBStronger = false;
                let reasons = [];
                
                // Compare Power
                if (b.power > a.power) {
                    isBStronger = true;
                    reasons.push(`мощь выше (${b.power} vs ${a.power})`);
                }
                
                // Compare individual stats
                const statKeys = ['attackBonus', 'defenseBonus', 'hpBonus', 'speedBonus', 'critBonus'];
                statKeys.forEach(k => {
                    const bVal = b.stats[k] || 0;
                    const aVal = a.stats[k] || 0;
                    if (bVal > 0 && bVal > aVal) {
                        isBStronger = true;
                        reasons.push(`стат ${k} выше (${bVal} vs ${aVal})`);
                    }
                });
                
                if (isBStronger) {
                    foundAnomalies = true;
                    out += `  - \`${b.id}\` (Ур ${b.requiredLevel}, ${b.rarity}) превосходит более высокоуровневый \`${a.id}\` (Ур ${a.requiredLevel}, ${a.rarity}): ${reasons.join(', ')}\n`;
                }
            }
        }
    }
    if (!foundAnomalies) out += `  - Аномалий не обнаружено\n`;
});

fs.writeFileSync('scratch/deep_power_progression_check.md', out);
console.log("Check saved to scratch/deep_power_progression_check.md");

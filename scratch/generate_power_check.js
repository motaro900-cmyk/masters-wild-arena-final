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
        (item.speedBonus || 0) * 250;
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
    
    // Sort by power
    items.sort((a, b) => a.power - b.power);
    
    items.forEach(item => {
        out += `* \`${item.id}\` (${item.name}, ${item.rarity}, Ур ${item.requiredLevel}) => **Мощь (GearScore): ${item.power}**\n`;
    });
    
    // Find anomalies: item with higher requiredLevel has lower power
    const anomalies = [];
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            if (items[j].requiredLevel < items[i].requiredLevel && items[j].power > items[i].power) {
                // items[j] (lower level) has higher power than items[i] (higher level)
                // or equivalently items[i] (higher level) has lower power than items[j] (lower level)
                anomalies.push({
                    higherLvlItem: items[i],
                    lowerLvlItem: items[j]
                });
            }
        }
    }
    
    // Let's filter unique anomalies to report cleanly
    if (anomalies.length > 0) {
        out += `  *⚠️ Обнаружены аномалии мощи:*\n`;
        // Group anomalies by higherLvlItem to avoid spam
        const uniqueHighs = [...new Set(anomalies.map(a => a.higherLvlItem.id))];
        uniqueHighs.forEach(highId => {
            const highItem = items.find(it => it.id === highId);
            const lowerItems = anomalies.filter(a => a.higherLvlItem.id === highId).map(a => `\`${a.lowerLvlItem.id}\` (Ур ${a.lowerLvlItem.requiredLevel}, Мощь ${a.lowerLvlItem.power})`);
            out += `    - Предмет \`${highItem.id}\` (Ур ${highItem.requiredLevel}, Мощь ${highItem.power}) имеет меньшую мощь, чем более низкоуровневые: ${lowerItems.join(', ')}\n`;
        });
    } else {
        out += `  *Аномалий мощи не обнаружено (мощь корректно возрастает с уровнем)*\n`;
    }
});

fs.writeFileSync('scratch/power_progression_check.md', out);
console.log("Check saved to scratch/power_progression_check.md");

import fs from 'fs';
import path from 'path';

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

const targetIds = [
    // Weapons
    'pan_master', 'stick_oak',
    'axe_executioner', 'daggers_assassin',
    'sword_silver', 'flail_guardian',
    'staff_sun_burst', 'claws_ice_fire',
    // Boots
    'sabatony_zheleznogo_legiona', 'boots_chain', 'boots_hunter',
    'boots_nekromanta', 'boots_rune', 'botforty_pustotnogo_ohotnika'
];

const allItems = [...parseFile('weapons.ts'), ...parseFile('boots.ts')];
let out = '';

targetIds.forEach(id => {
    const item = allItems.find(it => it.id === id);
    if (item) {
        out += `* \`${item.id}\` (Ур ${item.requiredLevel}, ${item.rarity}) => **Новая мощь: ${item.power}** (статы: ${JSON.stringify(item.stats)})\n`;
    }
});

fs.writeFileSync('scratch/power_boundaries_updated.md', out);
console.log("Boundary preview saved to scratch/power_boundaries_updated.md");

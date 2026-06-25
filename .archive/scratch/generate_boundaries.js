import fs from 'fs';
import path from 'path';

const itemsDir = 'src/game/configs/items';

const rarityConfigs = {
    COMMON: { base: 1, mult: 0.05 },
    RARE: { base: 2, mult: 0.08 },
    EPIC: { base: 3, mult: 0.12 },
    LEGENDARY: { base: 5, mult: 0.18 },
    MYTHIC: { base: 8, mult: 0.25 }
};

const slotBases = {
    helmets: { def: 8, hp: 80 },
    armor: { def: 7, hp: 70 },
    shields: { def: 9, hp: 90 },
    shoulders: { def: 5, hp: 50, atk: 3 },
    pants: { hp: 85 },
    boots: { def: 5, hp: 55 }
};

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
            
            if (rarityMatch && reqLvlMatch) {
                const name = nameMatch ? nameMatch[1] : currentItem;
                let rarity = rarityMatch[1];
                if (rarity.startsWith('ItemRarity.')) {
                    rarity = rarity.replace('ItemRarity.', '');
                }
                const requiredLevel = parseInt(reqLvlMatch[1], 10);
                items.push({ id: currentItem, name, rarity, requiredLevel });
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

const slots = ['helmets', 'armor', 'shields', 'shoulders', 'pants', 'boots'];
let out = '';

slots.forEach(slot => {
    out += `\n### Слот: ${slot.toUpperCase()}\n`;
    const items = parseFile(`${slot}.ts`);
    
    // Group by rarity
    const groups = {};
    items.forEach(item => {
        if (!groups[item.rarity]) groups[item.rarity] = [];
        groups[item.rarity].push(item);
    });
    
    Object.keys(groups).forEach(rarity => {
        const list = groups[rarity];
        list.sort((a, b) => a.requiredLevel - b.requiredLevel);
        
        const minItem = list[0];
        const maxItem = list[list.length - 1];
        
        const getStats = (item) => {
            const cfg = rarityConfigs[item.rarity];
            const lvl = item.requiredLevel;
            const bases = slotBases[slot];
            const factor = cfg.base + lvl * cfg.mult;
            const stats = {};
            if (bases.def) stats.defenseBonus = Math.round(bases.def * factor);
            if (bases.hp) stats.hpBonus = Math.round(bases.hp * factor);
            if (bases.atk) stats.attackBonus = Math.round(bases.atk * factor);
            return Object.entries(stats).map(([k, v]) => `${k}: ${v}`).join(', ');
        };
        
        out += `* **${rarity}**:\n`;
        out += `  - Min: \`${minItem.id}\` (Ур ${minItem.requiredLevel}) => ${getStats(minItem)}\n`;
        if (minItem.id !== maxItem.id) {
            out += `  - Max: \`${maxItem.id}\` (Ур ${maxItem.requiredLevel}) => ${getStats(maxItem)}\n`;
        }
    });
});

fs.writeFileSync('scratch/preview_boundaries.md', out);
console.log("Boundary preview saved to scratch/preview_boundaries.md");

import fs from 'fs';
import path from 'path';

const itemsDir = 'src/game/configs/items';

const rarityMults = {
    COMMON: 1.0,
    RARE: 1.3,
    EPIC: 1.8,
    LEGENDARY: 2.8,
    MYTHIC: 4.5
};

const slotRules = {
    helmets: { def: 8, hp: 80 },
    armor: { def: 7, hp: 70 },
    shields: { def: 9, hp: 90 },
    shoulders: { def: 5, atk: 3, hp: 50 },
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
    
    items.sort((a, b) => a.requiredLevel - b.requiredLevel);
    
    items.forEach(item => {
        const mult = rarityMults[item.rarity] || 1.0;
        const lvl = item.requiredLevel;
        const rule = slotRules[slot];
        
        const proposed = {};
        if (rule.def) proposed.defenseBonus = Math.round(rule.def * lvl * mult);
        if (rule.hp) proposed.hpBonus = Math.round(rule.hp * lvl * mult);
        if (rule.atk) proposed.attackBonus = Math.round(rule.atk * lvl * mult);
        
        const statsStr = Object.entries(proposed).map(([k, v]) => `${k}: ${v}`).join(', ');
        out += `* \`${item.id}\` (${item.name}, ${item.rarity}, Ур ${lvl}) => **${statsStr}**\n`;
    });
});

fs.writeFileSync('scratch/preview_results.md', out);
console.log("Markdown saved to scratch/preview_results.md");

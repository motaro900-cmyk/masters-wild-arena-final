import fs from 'fs';
import path from 'path';

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
            const atkMatch = body.match(/attackBonus\s*:\s*(\d+)/);
            
            if (rarityMatch && reqLvlMatch) {
                const name = nameMatch ? nameMatch[1] : currentItem;
                let rarity = rarityMatch[1];
                if (rarity.startsWith('ItemRarity.')) {
                    rarity = rarity.replace('ItemRarity.', '');
                }
                const requiredLevel = parseInt(reqLvlMatch[1], 10);
                const attackBonus = atkMatch ? parseInt(atkMatch[1], 10) : 0;
                items.push({ id: currentItem, name, rarity, requiredLevel, attackBonus });
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

const items = parseFile('weapons.ts');
const groups = {};

items.forEach(item => {
    if (!groups[item.rarity]) groups[item.rarity] = [];
    groups[item.rarity].push(item);
});

let out = '';
Object.keys(groups).forEach(rarity => {
    const list = groups[rarity];
    list.sort((a, b) => a.requiredLevel - b.requiredLevel);
    
    const minItem = list[0];
    const maxItem = list[list.length - 1];
    
    out += `* **${rarity}**:\n`;
    out += `  - Min: \`${minItem.id}\` (Ур ${minItem.requiredLevel}) => attackBonus: ${minItem.attackBonus}\n`;
    if (minItem.id !== maxItem.id) {
        out += `  - Max: \`${maxItem.id}\` (Ур ${maxItem.requiredLevel}) => attackBonus: ${maxItem.attackBonus}\n`;
    }
});

fs.writeFileSync('scratch/weapons_boundaries.md', out);
console.log("Weapons preview saved to scratch/weapons_boundaries.md");

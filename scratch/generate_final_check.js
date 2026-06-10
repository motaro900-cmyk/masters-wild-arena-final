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
                
                items.push({ id: currentItem, name, rarity, requiredLevel, stats });
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
    
    items.sort((a, b) => a.requiredLevel - b.requiredLevel);
    
    items.forEach(item => {
        const statsStr = Object.entries(item.stats).map(([k, v]) => `${k}: ${v}`).join(', ');
        out += `* \`${item.id}\` (Ур ${item.requiredLevel}, ${item.rarity}) => **${statsStr}**\n`;
    });
});

fs.writeFileSync('scratch/final_progression_check.md', out);
console.log("Check saved to scratch/final_progression_check.md");

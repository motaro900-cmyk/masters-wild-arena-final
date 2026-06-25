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
            const descMatch = body.match(/desc\s*:\s*['"`](.*?)['"`]/);
            
            if (rarityMatch && reqLvlMatch) {
                const name = nameMatch ? nameMatch[1] : currentItem;
                let rarity = rarityMatch[1];
                if (rarity.startsWith('ItemRarity.')) {
                    rarity = rarity.replace('ItemRarity.', '');
                }
                const requiredLevel = parseInt(reqLvlMatch[1], 10);
                const desc = descMatch ? descMatch[1] : '';
                items.push({ id: currentItem, name, rarity, requiredLevel, desc });
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
const slotData = {};
slots.forEach(s => {
    slotData[s] = parseFile(`${s}.ts`);
});

fs.writeFileSync('scratch/slot_raw_data.json', JSON.stringify(slotData, null, 2));
console.log("Raw items data saved to scratch/slot_raw_data.json");

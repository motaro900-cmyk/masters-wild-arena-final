import fs from 'fs';
import path from 'path';

const itemsDir = 'src/game/configs/items';
const slots = {
    weapons: 'weapons.ts',
    helmets: 'helmets.ts',
    armor: 'armor.ts',
    shields: 'shields.ts',
    shoulders: 'shoulders.ts',
    pants: 'pants.ts',
    boots: 'boots.ts'
};

let out = '# Итоговое распределение предметов (Диапазоны: 1-10, 11-27, 28-46, 47-63, 64-80)\n\n';

Object.entries(slots).forEach(([slot, fileName]) => {
    const filePath = path.join(itemsDir, fileName);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    out += `\n### Слот: ${slot.toUpperCase()}\n`;
    out += `| Уровень | Редкость | ID | Название | Характеристики | Описание |\n`;
    out += `| :---: | :---: | :--- | :--- | :--- | :--- |\n`;
    
    const items = [];
    let currentItem = null;
    let startIdx = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace('\r', '');
        const startMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*\{\s*$/);
        if (startMatch) {
            currentItem = startMatch[1];
            startIdx = i;
            continue;
        }
        
        if (currentItem && line.match(/^\s*\}\s*,\s*$/)) {
            const endIdx = i;
            const bodyLines = lines.slice(startIdx + 1, endIdx);
            const body = bodyLines.join('\n');
            
            const nameMatch = body.match(/name\s*:\s*['"`]([^'"`]+)['"`]/);
            const reqLvlMatch = body.match(/requiredLevel\s*:\s*(\d+)/);
            const rarityMatch = body.match(/rarity\s*:\s*['"`]([^'"`]+)['"`]/);
            const descMatch = body.match(/desc\s*:\s*['"`]([^'"`]+)['"`]/);
            
            const atkMatch = body.match(/attackBonus\s*:\s*(\d+)/);
            const defMatch = body.match(/defenseBonus\s*:\s*(\d+)/);
            const hpMatch = body.match(/hpBonus\s*:\s*(\d+)/);
            
            const statsArr = [];
            if (atkMatch) statsArr.push(`ATK: ${atkMatch[1]}`);
            if (defMatch) statsArr.push(`DEF: ${defMatch[1]}`);
            if (hpMatch) statsArr.push(`HP: ${hpMatch[1]}`);
            
            items.push({
                id: currentItem,
                name: nameMatch ? nameMatch[1] : '',
                level: reqLvlMatch ? parseInt(reqLvlMatch[1], 10) : 0,
                rarity: rarityMatch ? rarityMatch[1] : '',
                desc: descMatch ? descMatch[1] : '',
                stats: statsArr.join(', ')
            });
            
            currentItem = null;
        }
    }
    
    items.sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
    
    items.forEach(item => {
        out += `| **${item.level}** | **${item.rarity}** | \`${item.id}\` | ${item.name} | ${item.stats} | *${item.desc}* |\n`;
    });
});

fs.writeFileSync('scratch/proposed_tiers.md', out);
console.log("Updated proposed_tiers.md with actual items");

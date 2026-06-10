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

const baseAtk = 30;

function processFile(fileName) {
    const filePath = path.join(itemsDir, fileName);
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let currentItem = null;
    let currentLines = [];
    let startIdx = -1;
    
    const replacements = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace('\r', '');
        const startMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*\{\s*$/);
        if (startMatch) {
            currentItem = startMatch[1];
            currentLines = [];
            startIdx = i;
            continue;
        }
        
        if (currentItem && line.match(/^\s*\}\s*,\s*$/)) {
            const endIdx = i;
            const bodyLines = lines.slice(startIdx + 1, endIdx);
            const body = bodyLines.join('\n');
            
            const rarityMatch = body.match(/rarity\s*:\s*(?:ItemRarity\.)?['"`]?([A-Za-z0-9_]+)['"`]?/);
            const reqLvlMatch = body.match(/requiredLevel\s*:\s*(\d+)/);
            
            if (rarityMatch && reqLvlMatch) {
                let rarity = rarityMatch[1];
                if (rarity.startsWith('ItemRarity.')) {
                    rarity = rarity.replace('ItemRarity.', '');
                }
                const requiredLevel = parseInt(reqLvlMatch[1], 10);
                
                const cfg = rarityConfigs[rarity];
                if (cfg) {
                    const factor = cfg.base + requiredLevel * cfg.mult;
                    const newAttackBonus = Math.round(baseAtk * factor);
                    
                    const finalBodyLines = [];
                    for (let bodyLine of bodyLines) {
                        const trimmed = bodyLine.trim();
                        // skip old attackBonus
                        if (trimmed.startsWith('attackBonus:')) {
                            continue;
                        }
                        finalBodyLines.push(bodyLine);
                    }
                    
                    // Insert new attackBonus
                    let insertIdx = -1;
                    for (let k = 0; k < finalBodyLines.length; k++) {
                        if (finalBodyLines[k].includes('rarity') || finalBodyLines[k].includes('requiredLevel')) {
                            insertIdx = k;
                        }
                    }
                    if (insertIdx === -1) {
                        insertIdx = finalBodyLines.length - 1;
                    }
                    
                    finalBodyLines.splice(insertIdx + 1, 0, `        attackBonus: ${newAttackBonus},`);
                    
                    replacements.push({
                        start: startIdx + 1,
                        end: endIdx,
                        lines: finalBodyLines
                    });
                }
            }
            currentItem = null;
            continue;
        }
    }
    
    replacements.sort((a, b) => b.start - a.start);
    for (let rep of replacements) {
        lines.splice(rep.start, rep.end - rep.start, ...rep.lines);
    }
    
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`Updated ${fileName}`);
}

processFile('weapons.ts');
